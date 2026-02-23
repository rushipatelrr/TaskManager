const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getMe, registerValidators, loginValidators } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
