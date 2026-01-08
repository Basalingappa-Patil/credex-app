require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const Issuer = require("../models/Issuer");

(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  await Issuer.deleteMany({ issuer_id: "UNI001" });

  await Issuer.create({
    issuer_id: "UNI001",
    name: "Visvesvaraya Technological University",
    bpp_uri: "http://localhost:6000/beckn",
    public_key: process.env.BPP_PUBLIC_KEY,
    status: "trusted"
  });

  console.log("Issuer registry seeded successfully");
  process.exit(0);
})();
