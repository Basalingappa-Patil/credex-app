const express = require('express');
const router = express.Router();
const becknController = require('../controllers/becknController');

// Core Beckn Endpoints
router.post('/search', becknController.search);
router.post('/select', becknController.select);
router.post('/init', becknController.init);
router.post('/confirm', becknController.confirm);
router.post('/status', becknController.status);

module.exports = router;
