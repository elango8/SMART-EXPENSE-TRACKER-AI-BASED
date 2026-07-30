const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
} = require('../controllers/securityController');

router.post('/2fa/enable', protect, enableTwoFactor);
router.post('/2fa/verify', protect, verifyTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

module.exports = router;
