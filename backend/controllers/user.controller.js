const User = require('../models/user.model');
const Todo = require('../models/todo.model');
const { redisDel } = require('../config/redis.config');

// ─── Update profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.provider !== 'local') {
      return res.status(400).json({ success: false, message: 'OAuth accounts cannot change password' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// ─── Get user stats ───────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, completed, pending] = await Promise.all([
      Todo.countDocuments({ userId }),
      Todo.countDocuments({ userId, completed: true }),
      Todo.countDocuments({ userId, completed: false }),
    ]);

    const highPriority = await Todo.countDocuments({ userId, priority: 'high', completed: false });

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        highPriority,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        isPremium: req.user.isPremium,
        todosRemaining: req.user.isPremium ? '∞' : Math.max(0, 10 - total),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// ─── Delete account ───────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await Todo.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    await redisDel(`todos:${userId}`);

    res.clearCookie('token');
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

module.exports = { updateProfile, changePassword, getStats, deleteAccount };