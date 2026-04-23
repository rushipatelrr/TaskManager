const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
