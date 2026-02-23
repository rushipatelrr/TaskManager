const express = require('express');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, toggleTaskStatus, deleteTask, getStats, taskValidators
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect);

router.get('/stats', getStats);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', taskValidators, validate, createTask);
router.put('/:id', updateTask);
router.patch('/:id/toggle', toggleTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
