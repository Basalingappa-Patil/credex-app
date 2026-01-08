const express = require("express");
const axios = require("axios");
const Issuer = require("../models/Issuer");

const router = express.Router();

/**
 * QR-based verification (ONEST-correct)
 * Backend NEVER reads certificates directly.
 */
router.post("/verify", async (req, res) => {
  const { certificate_id } = req.body;

  if (!certificate_id) {
    return res.json({ verified: false });
  }

  // 1️⃣ Resolve issuer (single-university assumption for project)
  const issuer = await Issuer.findOne({
    issuer_id: "UNI001",
    status: "trusted"
  });

  if (!issuer) {
    return res.json({ verified: false });
  }

  // 2️⃣ Ask issuer to verify certificate
  try {
    const response = await axios.post(
      `${issuer.bpp_uri.replace("/beckn", "")}/verify/certificate/verify`,
      { certificate_id }
    );

    if (response.data.verified !== true) {
      return res.json({ verified: false });
    }

    // 3️⃣ Verified
    return res.json({
      verified: true,
      issuer: issuer.name,
      degree: response.data.degree
    });
  } catch (err) {
    return res.json({ verified: false });
  }
});

module.exports = router;
