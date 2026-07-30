const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  tokenVersion: { type: Number, default: 0 },
  twoFactorSecret: { type: String },
  twoFactorOTP: { type: String },
  twoFactorOTPExpires: { type: Date },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true },
    budgetAlerts: { type: Boolean, default: true },
    monthlyBudget: { type: Number, default: 5000 },
    budgetAlertThresholds: { type: [Number], default: [50, 75, 90, 100] },
    twoFactorEnabled: { type: Boolean, default: false },
    biometricsEnabled: { type: Boolean, default: false },
  },
}, { timestamps: true });

// Pre-save hook: hash password if modified.
// Uses pure async/await — no next() callback to avoid
// "next is not a function" errors with Express 5 + Mongoose.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw new Error('Failed to hash password: ' + err.message);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
