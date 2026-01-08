const express = require("express");
const Certificate = require("../models/Certificate");

const router = express.Router();

/**
 * Issuer-side certificate verification
 * Input: certificate_id
 */
router.post("/verify", async (req, res) => {
  const { certificate_id } = req.body;

  if (!certificate_id) {
    return res.json({ verified: false });
  }

  const cert = await Certificate.findOne({ certificate_id });

  if (!cert) {
    return res.json({ verified: false });
  }

  return res.json({
    verified: true,
    certificate_id: cert.certificate_id,
    degree: cert.degree
  });
});

module.exports = router;
