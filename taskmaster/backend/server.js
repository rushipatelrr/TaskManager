const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
const errorHandler = require('./middleware/errorHandler');
const { startRecurringTaskCron } = require('./cron/recurringTasks');

dotenv.config();

const app = express();

// Connect to MongoDB & seed default admin
connectDB().then(() => seedAdmin());

// Debug Logging
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

if (process.env.CLIENT_URL) {
  console.log("Allowed Origin:", process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TaskMaster API running', timestamp: new Date() });
});

// Email test route for debugging SMTP configuration
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address in the request body to test.' });
    }
    
    // We import sendOTPEmail just for testing since it requires simple parameters
    const { sendOTPEmail } = require('./utils/emailService');
    const result = await sendOTPEmail(email, '123456');
    
    if (result) {
      res.json({ success: true, message: `Test email successfully sent to ${email}. Check the console for detailed logs.` });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email. Check the server console for the exact error.' });
    }
  } catch (error) {
    console.error('Test email route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 TaskMaster Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start cron job
  startRecurringTaskCron();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
