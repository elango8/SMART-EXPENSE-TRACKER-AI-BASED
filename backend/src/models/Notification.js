const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['budget_alert', 'payment', 'system', 'insight'],
      default: 'system',
    },
    icon: { type: String, default: 'notifications' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient queries: user's notifications sorted by date
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
