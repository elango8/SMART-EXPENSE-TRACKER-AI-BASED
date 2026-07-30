const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phone, profileImage } = req.body;

    // Validate email uniqueness if changing
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      profileImage: updatedUser.profileImage || '',
      preferences: updatedUser.preferences,
      token: generateToken(updatedUser._id, updatedUser.tokenVersion),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/preferences
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      theme,
      notifications,
      budgetAlerts,
      monthlyBudget,
      budgetAlertThresholds,
      twoFactorEnabled,
      biometricsEnabled
    } = req.body;

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }

    // Partial update — only change fields that were sent
    if (theme !== undefined) user.preferences.theme = theme;
    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (budgetAlerts !== undefined) user.preferences.budgetAlerts = budgetAlerts;
    if (monthlyBudget !== undefined) user.preferences.monthlyBudget = monthlyBudget;
    if (budgetAlertThresholds !== undefined) user.preferences.budgetAlertThresholds = budgetAlertThresholds;
    if (twoFactorEnabled !== undefined) user.preferences.twoFactorEnabled = twoFactorEnabled;
    if (biometricsEnabled !== undefined) user.preferences.biometricsEnabled = biometricsEnabled;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      preferences: user.preferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword; // The pre('save') hook in User.js will hash this
    // Invalidate all existing sessions by incrementing tokenVersion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({
      message: 'Password changed successfully',
      forceLogout: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/profile/image
const uploadProfileImage = async (req, res) => {
  try {
    const { image } = req.body; // Base64 image data URI
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Validate image format (must be jpg, jpeg, png, or webp)
    const formatMatch = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
    if (!formatMatch) {
      return res.status(400).json({ message: 'Please upload a valid image (JPG, JPEG, PNG, or WEBP).' });
    }

    // Check size (5MB max — base64 is ~33% larger, so raw limit is ~6.7MB for base64 string)
    if (image.length > 6.7 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be below 5MB.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileImage = image;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully.',
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to upload image. Please try again.' });
  }
};

// DELETE /api/user/profile/image
const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileImage = '';
    await user.save();

    res.json({
      message: 'Profile image removed successfully',
      profileImage: '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/user/logout-all
const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate all tokens by incrementing tokenVersion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ message: 'Successfully logged out from all devices' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  uploadProfileImage,
  removeProfileImage,
  logoutAllDevices,
};
