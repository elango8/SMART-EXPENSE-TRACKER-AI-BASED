const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');

// All routes are protected
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.post('/', protect, createNotification);

// Order matters: specific routes before parameterized ones
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

router.delete('/all', protect, deleteAllNotifications);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
