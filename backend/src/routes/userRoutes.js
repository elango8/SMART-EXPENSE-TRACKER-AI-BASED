const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  uploadProfileImage,
  removeProfileImage,
  logoutAllDevices,
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/preferences', protect, updatePreferences);
router.put('/profile/image', protect, uploadProfileImage);
router.delete('/profile/image', protect, removeProfileImage);
router.put('/change-password', protect, changePassword);
router.post('/logout-all', protect, logoutAllDevices);

module.exports = router;
