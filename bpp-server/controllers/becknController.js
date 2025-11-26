const providerService = require('../services/providerService');
const cryptoService = require('../utils/cryptoService');
const { v4: uuidv4 } = require('uuid');

exports.search = async (req, res) => {
    try {
        const { context, message } = req.body;
        console.log('[BPP] Received Search Intent:', JSON.stringify(message.intent, null, 2));

        // Acknowledge immediately (Async Pattern)
        res.json({
            message: { ack: { status: 'ACK' } }
        });

        // Process asynchronously
        setTimeout(async () => {
            const results = await providerService.findOfferings(message.intent);

            const onSearchPayload = {
                context: { ...context, action: 'on_search', timestamp: new Date().toISOString() },
                message: {
                    catalog: {
                        descriptor: { name: 'Skill Verification BPP Catalog' },
                        providers: results
                    }
                }
            };

            // Sign the payload
            const signedPayload = await cryptoService.signPayload(onSearchPayload);

            // Send callback to BAP
            await providerService.sendCallback(context.bap_uri, 'on_search', signedPayload);
        }, 100);

    } catch (error) {
        console.error('[BPP] Search Error:', error);
    }
};

exports.select = async (req, res) => {
    try {
        const { context, message } = req.body;

        res.json({ message: { ack: { status: 'ACK' } } });

        setTimeout(async () => {
            const quote = await providerService.generateQuote(message.order);

            const onSelectPayload = {
                context: { ...context, action: 'on_select', timestamp: new Date().toISOString() },
                message: { order: quote }
            };

            await providerService.sendCallback(context.bap_uri, 'on_select', onSelectPayload);
        }, 100);
    } catch (error) {
        console.error('[BPP] Select Error:', error);
    }
};

exports.init = async (req, res) => {
    try {
        const { context, message } = req.body;
        res.json({ message: { ack: { status: 'ACK' } } });

        setTimeout(async () => {
            const initializedOrder = await providerService.initializeOrder(message.order);

            const onInitPayload = {
                context: { ...context, action: 'on_init', timestamp: new Date().toISOString() },
                message: { order: initializedOrder }
            };

            await providerService.sendCallback(context.bap_uri, 'on_init', onInitPayload);
        }, 100);
    } catch (error) {
        console.error('[BPP] Init Error:', error);
    }
};

exports.confirm = async (req, res) => {
    try {
        const { context, message } = req.body;
        res.json({ message: { ack: { status: 'ACK' } } });

        setTimeout(async () => {
            const confirmedOrder = await providerService.confirmOrder(message.order);

            const onConfirmPayload = {
                context: { ...context, action: 'on_confirm', timestamp: new Date().toISOString() },
                message: { order: confirmedOrder }
            };

            await providerService.sendCallback(context.bap_uri, 'on_confirm', onConfirmPayload);
        }, 100);
    } catch (error) {
        console.error('[BPP] Confirm Error:', error);
    }
};

exports.status = async (req, res) => {
    // Implementation for status check
    res.json({ message: { ack: { status: 'ACK' } } });
};
