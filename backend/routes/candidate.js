const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authMiddleware, candidateMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

router.use(authMiddleware);

router.get('/profile', candidateController.getProfile);
router.post('/credentials/add', upload.single('certificateFile'), candidateController.addCredential);
router.delete('/credentials/:credentialId', candidateController.deleteCredential);
router.get('/skill-graph', candidateController.getSkillGraph);
router.post('/refresh-verification', candidateController.refreshVerification);
router.get('/qrcode', candidateController.generateQRCode);

module.exports = router;
