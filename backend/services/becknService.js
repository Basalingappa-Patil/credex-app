const BecknTransactionLog = require('../models/BecknTransactionLog');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

class BecknService {
  constructor() {
    this.bapId = process.env.BAP_ID || 'skill-verification-bap';
    this.bapUri = process.env.BAP_URI || 'http://localhost:5001/api/beckn';
    this.bppUri = process.env.BPP_URI; // Target BPP
    this.gatewayUri = process.env.GATEWAY_URI; // Target Gateway
  }

  createContext(action, transactionId = null, messageId = null) {
    return {
      domain: 'skill-verification:1.0.0',
      action: action,
      version: '1.1.0',
      bap_id: this.bapId,
      bap_uri: this.bapUri,
      transaction_id: transactionId || uuidv4(),
      message_id: messageId || uuidv4(),
      timestamp: new Date().toISOString(),
      ttl: 'PT30M'
    };
  }

  async callNetwork(url, payload) {
    try {
      console.log('[Beckn] Sending ' + payload.context.action + ' to ' + url);

      // TODO: Add Request Signing here using PRIVATE_KEY

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Signature ...' 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Network call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[Beckn] Error calling network: ${error.message}`);
      throw error;
    }
  }

  async search(intent) {
    const context = this.createContext('search');

    const searchPayload = {
      context,
      message: {
        intent: {
          item: {
            descriptor: {
              name: intent.skillName || ''
            }
          },
          provider: {
            descriptor: {
              name: intent.issuerName || ''
            }
          },
          category: {
            descriptor: {
              code: intent.category || 'skill-verification'
            }
          }
        }
      }
    };

    await this.logTransaction(context.transaction_id, context.message_id, 'search', 'BAP', searchPayload, null, 'initiated');

    const targetUrl = this.gatewayUri ? `${this.gatewayUri}/search` : `${this.bppUri}/search`;

    // Fire and forget, or wait for ACK? Beckn is async, but we expect immediate ACK.
    this.callNetwork(targetUrl, searchPayload).catch(err => console.error('Search failed', err.message));

    return {
      message: {
        ack: {
          status: 'ACK'
        }
      },
      context
    };
  }

  async onSearch(payload) {
    const { context, message } = payload;
    await this.logTransaction(context.transaction_id, context.message_id, 'on_search', 'BPP', null, payload, 'received');
    console.log('[Beckn] Received on_search results');
    return { message: { ack: { status: 'ACK' } } };
  }

  async select(order) {
    const context = this.createContext('select');

    const selectPayload = {
      context,
      message: {
        order: {
          provider: {
            id: order.provider.id
          },
          items: order.items
        }
      }
    };

    await this.logTransaction(context.transaction_id, context.message_id, 'select', 'BAP', selectPayload, null, 'initiated');

    // Select goes directly to BPP usually, or via Gateway
    const targetUrl = `${this.bppUri}/select`;

    this.callNetwork(targetUrl, selectPayload).catch(err => console.error('Select failed', err.message));

    return {
      message: {
        ack: {
          status: 'ACK'
        }
      },
      context
    };
  }

  async onSelect(payload) {
    const { context, message } = payload;
    await this.logTransaction(context.transaction_id, context.message_id, 'on_select', 'BPP', null, payload, 'received');
    console.log('[Beckn] Received on_select quote');
    return { message: { ack: { status: 'ACK' } } };
  }

  async init(order) {
    // Implementation for init (similar structure)
    // ...
  }

  async onInit(payload) {
    // ...
  }

  async confirm(order, transactionId) {
    const context = this.createContext('confirm', transactionId);

    const confirmPayload = {
      context,
      message: {
        order: order // Contains billing, fulfillment, etc.
      }
    };

    await this.logTransaction(context.transaction_id, context.message_id, 'confirm', 'BAP', confirmPayload, null, 'initiated');

    const targetUrl = `${this.bppUri}/confirm`;

    this.callNetwork(targetUrl, confirmPayload).catch(err => console.error('Confirm failed', err.message));

    return {
      message: {
        ack: {
          status: 'ACK'
        }
      },
      context
    };
  }

  async onConfirm(payload) {
    const { context, message } = payload;
    await this.logTransaction(context.transaction_id, context.message_id, 'on_confirm', 'BPP', null, payload, 'received');
    console.log('[Beckn] Received on_confirm order');
    return { message: { ack: { status: 'ACK' } } };
  }

  async status(orderId) {
    const context = this.createContext('status');
    const statusPayload = {
      context,
      message: {
        order_id: orderId
      }
    };

    const targetUrl = `${this.bppUri}/status`;
    this.callNetwork(targetUrl, statusPayload).catch(err => console.error('Status check failed', err.message));

    return { message: { ack: { status: 'ACK' } }, context };
  }

  async onStatus(payload) {
    const { context } = payload;
    await this.logTransaction(context.transaction_id, context.message_id, 'on_status', 'BPP', null, payload, 'received');
    return { message: { ack: { status: 'ACK' } } };
  }

  async support(refId) {
    const context = this.createContext('support');
    const supportPayload = {
      context,
      message: {
        ref_id: refId
      }
    };
    const targetUrl = `${this.bppUri}/support`;
    this.callNetwork(targetUrl, supportPayload).catch(err => console.error('Support failed', err.message));
    return { message: { ack: { status: 'ACK' } }, context };
  }

  async onSupport(payload) {
    const { context } = payload;
    await this.logTransaction(context.transaction_id, context.message_id, 'on_support', 'BPP', null, payload, 'received');
    return { message: { ack: { status: 'ACK' } } };
  }

  async getResults(transactionId, action) {
    const log = await BecknTransactionLog.findOne({
      transactionId,
      action,
      role: 'BPP' // We want the response from the BPP
    }).sort({ timestamp: -1 });

    return log ? log.responsePayload : null;
  }

  async logTransaction(transactionId, messageId, action, role, requestPayload, responsePayload, status) {
    await BecknTransactionLog.create({
      transactionId,
      messageId,
      action,
      role,
      requestPayload,
      responsePayload,
      status,
      timestamp: new Date()
    });
  }
}

module.exports = new BecknService();
