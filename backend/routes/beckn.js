const express = require('express');
const router = express.Router();
const becknController = require('../controllers/becknController');

router.post('/search', becknController.search);
router.post('/on_search', becknController.onSearch);
router.post('/select', becknController.select);
router.post('/on_select', becknController.onSelect);
router.post('/confirm', becknController.confirm);
router.post('/on_confirm', becknController.onConfirm);
router.post('/status', becknController.status);
router.post('/on_status', becknController.onStatus);
router.post('/support', becknController.support);
router.post('/on_support', becknController.onSupport);
router.get('/results', becknController.getResults);

module.exports = router;
