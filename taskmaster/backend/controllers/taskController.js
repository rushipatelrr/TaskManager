const { body } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc Get tasks (with filtering, search, pagination)
// @route GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      assignedTo,
      isRecurring
    } = req.query;

    const query = {};

    // Admins see all, users see only their tasks
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (isRecurring !== undefined) query.isRecurring = isRecurring === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      tasks,
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

// @desc Get single task
// @route GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && task.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc Create task
// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, assignedTo, isRecurring, recurrence, pointValue, tags } = req.body;

    const taskData = {
      title,
      description,
      dueDate,
      priority,
      createdBy: req.user._id,
      assignedTo: assignedTo || req.user._id,
      isRecurring: isRecurring || false,
      pointValue: pointValue || 10,
      tags: tags || []
    };

    if (isRecurring && recurrence) {
      taskData.recurrence = recurrence;
    }

    const task = await Task.create(taskData);
    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({ success: true, message: 'Task created successfully', task: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only admin or creator can update
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const { title, description, dueDate, priority, assignedTo, isRecurring, recurrence, pointValue, tags } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (isRecurring !== undefined) task.isRecurring = isRecurring;
    if (recurrence) task.recurrence = recurrence;
    if (pointValue) task.pointValue = pointValue;
    if (tags) task.tags = tags;

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({ success: true, message: 'Task updated successfully', task: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle task status (complete/pending) with points logic
// @route PATCH /api/tasks/:id/toggle
const toggleTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const wasCompleted = task.status === 'completed';

    if (!wasCompleted) {
      // Marking as complete
      task.status = 'completed';
      task.completedAt = new Date();

      // Award points ONLY if not already awarded (prevents duplicate points)
      if (!task.pointsAwarded) {
        task.pointsAwarded = true;
        const points = task.pointValue || 10;

        await User.findByIdAndUpdate(
          task.assignedTo || req.user._id,
          {
            $inc: { totalPoints: points },
            $push: {
              pointHistory: {
                taskId: task._id,
                taskTitle: task.title,
                points,
                earnedAt: new Date()
              }
            }
          }
        );
      }
    } else {
      // Marking back to pending — do NOT deduct points, just reset status
      task.status = 'pending';
      task.completedAt = undefined;
    }

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({ success: true, message: `Task marked as ${task.status}`, task: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Get dashboard stats
// @route GET /api/tasks/stats
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      const [totalTasks, completedTasks, pendingTasks, users] = await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: 'completed' }),
        Task.countDocuments({ status: 'pending' }),
        User.find().select('name email totalPoints avatar role').sort({ totalPoints: -1 })
      ]);

      return res.json({
        success: true,
        stats: { totalTasks, completedTasks, pendingTasks },
        leaderboard: users
      });
    }

    // User stats
    const [total, completed, pending] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'completed' }),
      Task.countDocuments({ assignedTo: userId, status: 'pending' })
    ]);

    const user = await User.findById(userId).select('totalPoints pointHistory');

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        totalPoints: user.totalPoints,
        pointHistory: user.pointHistory?.slice(-10).reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validators
const taskValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['pending', 'completed']).withMessage('Invalid status')
];

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  getStats,
  taskValidators
};
