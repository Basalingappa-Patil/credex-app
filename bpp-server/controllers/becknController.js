const providerService = require('../services/providerService');
const cryptoService = require('../utils/cryptoService');
const { v4: uuidv4 } = require('uuid');

/**
 * ------------------------
 * SEARCH
 * ------------------------
 */
exports.search = async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log('[BPP] Received Search Intent:', JSON.stringify(message.intent, null, 2));

    res.json({ message: { ack: { status: 'ACK' } } });

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

      const signedPayload = await cryptoService.signPayload(onSearchPayload);
      await providerService.sendCallback(context.bap_uri, 'on_search', signedPayload);
    }, 100);

  } catch (error) {
    console.error('[BPP] Search Error:', error);
  }
};

/**
 * ------------------------
 * SELECT
 * ------------------------
 */
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

/**
 * ------------------------
 * INIT
 * ------------------------
 */
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

/**
 * ------------------------
 * CONFIRM  🔥 (SYNC VERIFICATION FOR STUDENT PROJECT)
 * ------------------------
 */
exports.confirm = async (req, res) => {
  try {
    const item = req.body?.message?.order?.items?.[0];

    if (!item) {
      return res.status(400).json({ error: "Missing order item" });
    }

    const skill_name = item.id;
    const student_id = item.tags?.student_id;

    if (!skill_name || !student_id) {
      return res.status(400).json({ error: "Invalid confirm payload" });
    }

    console.log(`[BPP] Verifying skill "${skill_name}" for student ${student_id}`);

    const result = await providerService.verifySkill({
      student_id,
      skill_name
    });

    return res.json({
      message: {
        order: {
          items: [
            {
              id: skill_name,
              tags: {
                verified: result.verified,
                nsqf_level: result.nsqf_level,
                confidence: result.confidence,
                certificate_id: result.certificate_id
              }
            }
          ]
        }
      }
    });

  } catch (err) {
    console.error("[BPP] Confirm failed:");
    console.error(err.stack || err);

    return res.status(500).json({
      error: "Verification failed",
      reason: err.message
    });
  }
};


/**
 * ------------------------
 * STATUS
 * ------------------------
 */
exports.status = async (req, res) => {
  res.json({ message: { ack: { status: 'ACK' } } });
}


