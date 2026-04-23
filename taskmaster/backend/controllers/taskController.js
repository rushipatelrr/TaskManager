const { body } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTaskEmail } = require('../utils/emailService');

const taskPopulateOptions = [
  { path: 'assignedTo', select: 'name email avatar' },
  { path: 'assignedBy', select: 'name email avatar' },
  { path: 'createdBy', select: 'name email' }
];

const normalizeAssigneeIds = (assignedTo, fallbackAssignee) => {
  let assignees = [];

  if (Array.isArray(assignedTo)) {
    assignees = assignedTo;
  } else if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
    assignees = [assignedTo];
  } else if (fallbackAssignee !== undefined) {
    assignees = [fallbackAssignee];
  }

  return [...new Set(
    assignees
      .filter(Boolean)
      .map((assignee) => (assignee._id ? assignee._id.toString() : assignee.toString()))
  )];
};

const haveAssigneesChanged = (previousAssigneeIds, nextAssigneeIds) => {
  if (previousAssigneeIds.length !== nextAssigneeIds.length) return true;

  const nextAssigneeSet = new Set(nextAssigneeIds);
  return previousAssigneeIds.some((assigneeId) => !nextAssigneeSet.has(assigneeId));
};

const notifyTaskUsers = async (users, task, type) => {
  await Promise.all(
    (users || [])
      .filter((user) => user?.email)
      .map((user) => sendTaskEmail(user.email, task, type))
  );
};

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
      roleView,
      isRecurring
    } = req.query;

    const query = {};

    // Admins see all, users see tasks they are involved in
    if (req.user.role !== 'admin') {
      if (roleView === 'created') {
        query.$or = [{ createdBy: req.user._id }, { assignedBy: req.user._id }];
      } else if (roleView === 'assigned') {
        query.assignedTo = req.user._id;
      } else if (assignedTo) {
        query.assignedTo = assignedTo;
      } else {
        query.$or = [
          { assignedTo: req.user._id },
          { assignedBy: req.user._id },
          { createdBy: req.user._id }
        ];
      }
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
      .populate('assignedBy', 'name email avatar')
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
      .populate('assignedBy', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const isAssignee = task.assignedTo.some(u => u._id.toString() === req.user._id.toString());
      const isCreator = task.createdBy._id.toString() === req.user._id.toString();
      const isAssignedBy = task.assignedBy?._id?.toString() === req.user._id.toString();
      if (!isAssignee && !isCreator && !isAssignedBy) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
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

    const assignees = normalizeAssigneeIds(assignedTo, req.user._id);

    // RBAC: Non-admin users cannot assign tasks to admin users
    if (req.user.role !== 'admin' && assignees.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: assignees } }).select('role name');
      const adminAssignees = assignedUsers.filter(u => u.role === 'admin');
      if (adminAssignees.length > 0) {
        const adminNames = adminAssignees.map(u => u.name).join(', ');
        return res.status(403).json({
          success: false,
          message: `Non-admin users cannot assign tasks to admin users (${adminNames})`
        });
      }
    }

    const taskData = {
      title,
      description,
      dueDate,
      priority,
      createdBy: req.user._id,
      assignedBy: req.user._id,
      assignedTo: assignees,
      isRecurring: isRecurring || false,
      pointValue: pointValue || 10,
      tags: tags || []
    };

    if (isRecurring && recurrence) {
      taskData.recurrence = recurrence;
    }

    const task = await Task.create(taskData);
    const populated = await task.populate(taskPopulateOptions);

    await notifyTaskUsers(populated.assignedTo, populated, 'assigned');

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
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignedBy = task.assignedBy?.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isCreator && !isAssignedBy) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const { title, description, dueDate, priority, assignedTo, isRecurring, recurrence, pointValue, tags } = req.body;
    const previousAssigneeIds = task.assignedTo.map((assignee) => assignee.toString());
    let assigneesChanged = false;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) {
      task.dueDate = dueDate === null ? undefined : dueDate;
    }
    if (priority) task.priority = priority;
    if (assignedTo !== undefined) {
      const newAssignees = normalizeAssigneeIds(assignedTo);

      // RBAC: Non-admin users cannot assign tasks to admin users
      if (req.user.role !== 'admin') {
        const assignedUsers = await User.find({ _id: { $in: newAssignees } }).select('role name');
        const adminAssignees = assignedUsers.filter(u => u.role === 'admin');
        if (adminAssignees.length > 0) {
          const adminNames = adminAssignees.map(u => u.name).join(', ');
          return res.status(403).json({
            success: false,
            message: `Non-admin users cannot assign tasks to admin users (${adminNames})`
          });
        }
      }

      assigneesChanged = haveAssigneesChanged(previousAssigneeIds, newAssignees);
      task.assignedTo = newAssignees;

      if (assigneesChanged && task.status === 'completed') {
        console.log(`[Task] Task ${task._id} reassigned from completed state. Resetting to pending.`);
        task.status = 'pending';
        task.completedAt = undefined;
        task.pointsAwarded = false;

        if (task.isRecurring && task.recurrence) {
          const { getNextDate } = require('../utils/dateHelper');
          task.dueDate = getNextDate(task.dueDate || new Date(), task.recurrence.type, task.recurrence.interval);
          console.log(`[Task] Recurring task ${task._id} updated dueDate to ${task.dueDate}`);
        }
      }
    }
    if (isRecurring !== undefined) task.isRecurring = isRecurring;
    if (recurrence !== undefined) task.recurrence = recurrence;
    if (pointValue !== undefined) task.pointValue = pointValue;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    const populated = await task.populate(taskPopulateOptions);

    if (assigneesChanged) {
      const previousAssigneeSet = new Set(previousAssigneeIds);
      const newlyAssignedUsers = populated.assignedTo.filter(
        (user) => !previousAssigneeSet.has(user._id.toString())
      );

      await notifyTaskUsers(newlyAssignedUsers, populated, 'reassigned');
    }

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

    // Only assigned user can complete task
    const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());
    
    if (!isAssignee) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
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

        const pointRecipient = task.assignedTo.includes(req.user._id) ? req.user._id : task.assignedTo[0] || req.user._id;

        await User.findByIdAndUpdate(
          pointRecipient,
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
      return res.status(400).json({ success: false, message: 'Completed tasks cannot be reverted. They must be reassigned.' });
    }

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'assignedBy', select: 'name email avatar' },
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

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignedBy = task.assignedBy?.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isCreator && !isAssignedBy) {
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
