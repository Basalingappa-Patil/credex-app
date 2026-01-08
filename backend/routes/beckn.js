const express = require("express");
const controller = require("../controllers/becknController");
const verifyIssuer = require("../middleware/verifyIssuer");

const router = express.Router();

// outbound
router.post("/search", controller.search);
router.post("/select", controller.select);
router.post("/confirm", controller.confirm);
router.post("/status", controller.status);
router.post("/support", controller.support);

// inbound (STRICTLY VERIFIED)
router.post("/on_search", verifyIssuer, controller.onSearch);
router.post("/on_select", verifyIssuer, controller.onSelect);
router.post("/on_confirm", verifyIssuer, controller.onConfirm);
router.post("/on_status", verifyIssuer, controller.onStatus);
router.post("/on_support", verifyIssuer, controller.onSupport);

module.exports = router;
