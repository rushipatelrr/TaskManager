const cron = require('node-cron');
const Task = require('../models/Task');
const { getNextDate } = require('../utils/dateHelper');
const { sendTaskEmail } = require('../utils/emailService');

const startRecurringTaskCron = () => {
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  // Run every day at midnight (00:00) in configured timezone
  cron.schedule('0 0 * * *', async () => {
    const startTime = new Date();
    console.log(`\n[CRON] Recurring task job started at ${startTime.toLocaleString('en-IN', { timeZone: timezone })}`);

    const now = new Date();
    try {
      const recurringTasks = await Task.find({
        isRecurring: true,
        status: 'completed',
        'recurrence.autoReassign': true,
        dueDate: { $lt: now }
      })
        .populate('assignedTo', 'name email avatar')
        .populate('assignedBy', 'name email avatar');

      console.log(`[CRON] Found ${recurringTasks.length} recurring completed tasks`);

      if (recurringTasks.length === 0) {
        console.log('[CRON] No tasks to reassign.\n');
        return;
      }

      let successCount = 0;
      let skipCount = 0;
      const errors = [];

      for (const task of recurringTasks) {
        try {
          const runTime = new Date();
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          if (task.recurrence?.lastCompletedAt >= todayStart) {
            console.log(`[CRON] Task "${task.title}" already processed today - skipping`);
            skipCount++;
            continue;
          }

          const nextDueDate = getNextDate(
            task.dueDate || runTime,
            task.recurrence.type,
            task.recurrence.interval || 1
          );

          task.status = 'pending';
          task.dueDate = nextDueDate;
          task.pointsAwarded = false;
          task.completedAt = undefined;
          task.recurrence.lastCompletedAt = runTime;

          await task.save();

          await Promise.all(
            (task.assignedTo || [])
              .filter((user) => user?.email)
              .map((user) => sendTaskEmail(user.email, task, 'recurring'))
          );

          console.log(`[CRON] Task "${task.title}" reset -> pending | Next due: ${nextDueDate.toDateString()}`);
          successCount++;
        } catch (taskError) {
          console.error(`[CRON] Error processing task "${task.title}": ${taskError.message}`);
          errors.push({ taskId: task._id, title: task.title, error: taskError.message });
        }
      }

      const duration = Date.now() - startTime.getTime();
      console.log(`\n[CRON] Summary: ${successCount} reset | ${skipCount} skipped | ${errors.length} errors | ${duration}ms\n`);
    } catch (error) {
      console.error(`[CRON] Fatal error in recurring task job: ${error.message}`);
    }
  }, {
    timezone
  });

  console.log(`[CRON] Recurring task cron scheduled (timezone: ${timezone}) - runs daily at 00:00`);
};

module.exports = { startRecurringTaskCron };
