const nodemailer = require('nodemailer');

let transporter;
let missingConfigLogged = false;

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (!missingConfigLogged) {
      console.warn('Email service disabled: EMAIL_USER and EMAIL_PASS must be configured.');
      missingConfigLogged = true;
    }

    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Enable logging and debugging based on environment variables for easier troubleshooting
      logger: process.env.DEBUG_EMAIL === 'true',
      debug: process.env.DEBUG_EMAIL === 'true'
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.error(`[Email Service] Cannot send email to ${to}: SMTP Transporter not configured.`);
    return false;
  }

  try {
    console.log(`[Email Service] Attempting to send email to: ${to} (Subject: ${subject})`);
    
    const info = await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });

    console.log(`[Email Service] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Email send failed for ${to}. Full Error:`, error);
    return false;
  }
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return 'Not set';

  const parsedDate = new Date(dueDate);
  if (Number.isNaN(parsedDate.getTime())) return 'Not set';

  const isDateOnlyMidnightUtc = (
    parsedDate.getUTCHours() === 0 &&
    parsedDate.getUTCMinutes() === 0 &&
    parsedDate.getUTCSeconds() === 0 &&
    parsedDate.getUTCMilliseconds() === 0
  );

  // Date-only values are treated as end-of-day in email copy so they read naturally
  // while keeping the stored DB value and cron logic unchanged.
  if (isDateOnlyMidnightUtc) {
    const displayDate = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeZone: 'UTC'
    }).format(parsedDate);

    return `${displayDate}, 11:59 pm`;
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.EMAIL_TIMEZONE || process.env.CRON_TIMEZONE || 'Asia/Kolkata'
  }).format(parsedDate);
};

const getAssignedByName = (task) => {
  const assignedBy = task?.assignedBy;

  if (assignedBy && typeof assignedBy === 'object') {
    return assignedBy.name || assignedBy.email || 'TaskMaster';
  }

  if (task?.assignedByName) {
    return task.assignedByName;
  }

  return 'TaskMaster';
};

const sendTaskEmail = async (email, task, type) => {
  const subjectMap = {
    assigned: `Task assigned: ${task.title}`,
    reassigned: `Task reassigned: ${task.title}`,
    recurring: `Recurring task reminder: ${task.title}`
  };

  const introMap = {
    assigned: 'A new task has been assigned to you.',
    reassigned: 'A task has been reassigned to you.',
    recurring: 'A recurring task is ready for you again.'
  };

  const lines = [
    introMap[type] || 'You have a task update.',
    '',
    `Task Title: ${task.title}`,
    `Assigned By: ${getAssignedByName(task)}`,
    `Due Date & Time: ${formatDueDate(task.dueDate)}`
  ];

  if (type === 'recurring') {
    lines.push('This is a recurring task.');
  }

  return sendEmail({
    to: email,
    subject: subjectMap[type] || `Task update: ${task.title}`,
    text: lines.join('\n')
  });
};

const sendOTPEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: 'TaskMaster password reset OTP',
    text: [
      'We received a request to reset your TaskMaster password.',
      '',
      `Your OTP is: ${otp}`,
      'This OTP will expire in 10 minutes.',
      '',
      'If you did not request this, you can safely ignore this email.'
    ].join('\n')
  });
};

module.exports = { sendTaskEmail, sendOTPEmail };
