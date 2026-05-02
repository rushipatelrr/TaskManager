const crypto = require('crypto');
const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendOTPEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESET_OTP_EXPIRY_MINUTES = 10;

const generateResetOTP = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const hashOTP = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      // Only allow admin creation if first user or explicitly set in dev
      role: role === 'admin' && process.env.NODE_ENV !== 'production' ? 'admin' : 'user'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalPoints: user.totalPoints,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalPoints: user.totalPoints,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub: googleId, name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    } else {
      user = await User.create({ name, email, googleId, avatar: picture });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalPoints: user.totalPoints,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      totalPoints: req.user.totalPoints,
      avatar: req.user.avatar,
      pointHistory: req.user.pointHistory
    }
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetOTP +resetOTPExpire');

    if (user) {
      const otp = generateResetOTP();

      user.resetOTP = hashOTP(otp);
      user.resetOTPExpire = new Date(Date.now() + RESET_OTP_EXPIRY_MINUTES * 60 * 1000);

      await user.save({ validateBeforeSave: false });
      await sendOTPEmail(user.email, otp);
    }

    res.json({
      success: true,
      message: 'If an account exists for that email, a reset OTP has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase();
    const { otp, newPassword } = req.body;

    const user = await User.findOne({ email: normalizedEmail }).select('+resetOTP +resetOTPExpire');

    if (!user || !user.resetOTP || !user.resetOTPExpire) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (user.resetOTPExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (user.resetOTP !== hashOTP(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

// Validators
const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
];

const resetPasswordValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be a 6-digit code'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

module.exports = {
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
};
