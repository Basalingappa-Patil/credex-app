const Issuer = require("../models/Issuer");
const sodium = require("sodium-native");

module.exports = async function verifyIssuer(req, res, next) {
  try {
    const { context, message, signature } = req.body;

    if (!context?.provider?.id) {
      return res.status(400).json({ error: "Missing provider id" });
    }

    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    const issuer = await Issuer.findOne({
      issuer_id: context.provider.id,
      status: "trusted"
    });

    if (!issuer) {
      return res.status(403).json({ error: "Untrusted or unknown issuer" });
    }

    const payload = { context, message };

    const isValid = sodium.crypto_sign_verify_detached(
      Buffer.from(signature, "base64"),
      Buffer.from(JSON.stringify(payload)),
      Buffer.from(issuer.public_key, "base64")
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    req.issuer = issuer;
    next();
  } catch (err) {
    console.error("Issuer verification error:", err);
    res.status(500).json({ error: "Issuer verification failed" });
  }
};
