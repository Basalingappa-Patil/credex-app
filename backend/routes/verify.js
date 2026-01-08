const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const multer = require('multer');
const path = require('path');

// Configure Multer for temp uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

router.get('/by-id/:candidateId', verifyController.verifyById);
router.post('/by-qr', upload.single('qrImage'), verifyController.verifyByQR);
router.get('/claims/:candidateId', verifyController.getCandidateClaims);
router.post('/credential/:credentialId', verifyController.verifyStoredCredential);
router.post('/json', express.json({ limit: '10mb' }), verifyController.verifyByJSON);
router.get('/revocation-status/:credentialId', verifyController.checkRevocationStatus);

module.exports = router;
