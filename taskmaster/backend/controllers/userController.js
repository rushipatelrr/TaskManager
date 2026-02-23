const User = require('../models/User');
const Task = require('../models/Task');

// @desc Get all users (admin)
// @route GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-pointHistory')
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get leaderboard
// @route GET /api/users/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email totalPoints avatar role')
      .sort({ totalPoints: -1 })
      .limit(50);

    res.json({ success: true, leaderboard: users });
  } catch (error) {
    next(error);
  }
};

// @desc Update user role (admin)
// @route PATCH /api/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-pointHistory');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle user active status (admin)
// @route PATCH /api/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc Get user activity/point history
// @route GET /api/users/:id/activity
const getUserActivity = async (req, res, next) => {
  try {
    const targetId = req.params.id === 'me' ? req.user._id : req.params.id;

    if (req.user.role !== 'admin' && targetId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(targetId).select('name email totalPoints pointHistory avatar');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tasks = await Task.find({ assignedTo: targetId })
      .select('title status priority completedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      user,
      recentActivity: tasks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getLeaderboard, updateUserRole, toggleUserStatus, getUserActivity };
