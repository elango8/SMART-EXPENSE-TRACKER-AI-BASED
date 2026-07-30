const User = require('../models/User');

// POST /api/security/2fa/enable
const enableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save temporary OTP and expiry
    user.twoFactorOTP = otp;
    user.twoFactorOTPExpires = expiry;
    await user.save();

    // In a real production app, we would send this OTP via SMS or Email.
    // For this simulation, we return it to the frontend.
    res.json({
      message: 'OTP sent successfully (Simulated)',
      otp, // return OTP for simulation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/security/2fa/verify
const verifyTwoFactor = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorOTP || user.twoFactorOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.twoFactorOTPExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Clear OTP fields and set 2FA enabled
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpires = undefined;
    user.preferences.twoFactorEnabled = true;
    await user.save();

    res.json({
      message: 'Two-factor authentication enabled successfully',
      twoFactorEnabled: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/security/2fa/disable
const disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences.twoFactorEnabled = false;
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpires = undefined;
    await user.save();

    res.json({
      message: 'Two-factor authentication disabled successfully',
      twoFactorEnabled: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
};
