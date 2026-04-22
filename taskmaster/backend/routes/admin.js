const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserStatus, updateUserRole, getAdminStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

// GET /api/admin/stats - Admin dashboard stats
router.get('/stats', getAdminStats);

// GET /api/admin/users - List all users (search, filter, pagination)
router.get('/users', getAllUsers);

// PATCH /api/admin/users/:id/status - Activate/Deactivate user
router.patch('/users/:id/status', updateUserStatus);

// PATCH /api/admin/users/:id/role - Promote/Demote user
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
