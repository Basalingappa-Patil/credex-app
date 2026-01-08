const mongoose = require("mongoose");

const IssuerSchema = new mongoose.Schema(
  {
    issuer_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    bpp_uri: {
      type: String,
      required: true
    },
    public_key: {
      type: String, // base64 Ed25519 public key
      required: true
    },
    status: {
      type: String,
      enum: ["trusted", "revoked"],
      default: "trusted"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issuer", IssuerSchema);
