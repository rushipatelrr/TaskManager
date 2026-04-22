const express = require('express');
const router = express.Router();
const { getAllUsers, getLeaderboard, updateUserRole, toggleUserStatus, getUserActivity } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/list', require('../controllers/userController').getUserList);
router.get('/leaderboard', getLeaderboard);
router.get('/activity/:id', getUserActivity);

// Admin only
router.get('/', adminOnly, getAllUsers);
router.patch('/:id/role', adminOnly, updateUserRole);
router.patch('/:id/toggle-status', adminOnly, toggleUserStatus);

module.exports = router;
