const User = require('../models/User');
const Task = require('../models/Task');


const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role && ['admin', 'user'].includes(role)) {
      query.role = role;
    }

    // Filter by active status
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-pointHistory -password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Summary counts
    const [totalUsers, totalAdmins, totalActive, totalInactive] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false })
    ]);

    res.json({
      success: true,
      users,
      summary: { totalUsers, totalAdmins, totalActive, totalInactive },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && !isActive) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        totalPoints: user.totalPoints,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "admin" or "user"' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role === 'user') {
      return res.status(400).json({ success: false, message: 'You cannot demote your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-pointHistory -password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      totalTasks,
      completedTasks,
      pendingTasks,
      leaderboard
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'pending' }),
      User.find({ isActive: true })
        .select('name email totalPoints avatar role')
        .sort({ totalPoints: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        activeUsers,
        inactiveUsers,
        totalTasks,
        completedTasks,
        pendingTasks
      },
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, updateUserStatus, updateUserRole, getAdminStats };
