const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', adminController.getDashboard);
router.get('/candidates', adminController.getCandidates);
router.get('/issuers', adminController.getIssuers);
router.get('/verification-logs', adminController.getVerificationLogs);
router.get('/beckn-logs', adminController.getBecknLogs);
router.get('/errors', adminController.getErrors);
router.get('/employers', adminController.getEmployers);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
