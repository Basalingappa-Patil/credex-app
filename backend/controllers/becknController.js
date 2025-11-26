const becknService = require('../services/becknService');

exports.search = async (req, res) => {
  try {
    const { intent } = req.body;

    // In real Beckn, we send ACK immediately and process async
    // becknService.search returns the ACK payload
    const response = await becknService.search(intent);

    res.json(response);
  } catch (error) {
    console.error('Beckn search error:', error);
    res.status(500).json({
      message: {
        ack: {
          status: 'NACK'
        }
      },
      error: error.message
    });
  }
};

exports.onSearch = async (req, res) => {
  try {
    const response = await becknService.onSearch(req.body);
    res.json(response);
  } catch (error) {
    console.error('Beckn on_search error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.select = async (req, res) => {
  try {
    const { order, context } = req.body;
    const { provider, items } = order;

    // Pass transactionId from context if available to link flows
    const transactionId = context?.transaction_id;

    const response = await becknService.select(provider.id, items[0].id, transactionId);

    res.json(response);
  } catch (error) {
    console.error('Beckn select error:', error);
    res.status(500).json({
      message: {
        ack: {
          status: 'NACK'
        }
      },
      error: error.message
    });
  }
};

exports.onSelect = async (req, res) => {
  try {
    const response = await becknService.onSelect(req.body);
    res.json(response);
  } catch (error) {
    console.error('Beckn on_select error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const { order, context } = req.body;
    const transactionId = context?.transaction_id;

    const response = await becknService.confirm(order, transactionId);

    res.json(response);
  } catch (error) {
    console.error('Beckn confirm error:', error);
    res.status(500).json({
      message: {
        ack: {
          status: 'NACK'
        }
      },
      error: error.message
    });
  }
};

exports.onConfirm = async (req, res) => {
  try {
    const response = await becknService.onConfirm(req.body);
    res.json(response);
  } catch (error) {
    console.error('Beckn on_confirm error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.status = async (req, res) => {
  try {
    const { order_id } = req.body.message; // Fixed: order_id is usually in message
    const { context } = req.body;
    const transactionId = context?.transaction_id;

    const response = await becknService.status(order_id, transactionId);

    res.json(response);
  } catch (error) {
    console.error('Beckn status error:', error);
    res.status(500).json({
      message: {
        ack: {
          status: 'NACK'
        }
      },
      error: error.message
    });
  }
};

exports.onStatus = async (req, res) => {
  try {
    const response = await becknService.onStatus(req.body);
    res.json(response);
  } catch (error) {
    console.error('Beckn on_status error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.support = async (req, res) => {
  try {
    const { ref_id } = req.body.message;
    const { context } = req.body;
    const transactionId = context?.transaction_id;

    const response = await becknService.support(ref_id, transactionId);

    res.json(response);
  } catch (error) {
    console.error('Beckn support error:', error);
    res.status(500).json({
      message: {
        ack: {
          status: 'NACK'
        }
      },
      error: error.message
    });
  }
};

exports.onSupport = async (req, res) => {
  try {
    const response = await becknService.onSupport(req.body);
    res.json(response);
  } catch (error) {
    console.error('Beckn on_support error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { transactionId, action } = req.query;
    const results = await becknService.getResults(transactionId, action);

    if (results) {
      res.json({ status: 'completed', results });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error) {
    console.error('Beckn getResults error:', error);
    res.status(500).json({ error: error.message });
  }
};
