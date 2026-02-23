const cron = require('node-cron');
const Task = require('../models/Task');
const { getNextDate } = require('../utils/dateHelper');

const startRecurringTaskCron = () => {
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  // Run every day at midnight (00:00) in configured timezone
  cron.schedule('0 0 * * *', async () => {
    const startTime = new Date();
    console.log(`\n🕛 [CRON] Recurring task job started at ${startTime.toLocaleString('en-IN', { timeZone: timezone })}`);

    const now = new Date();
    try {
      // Find eligible tasks:
      // - isRecurring = true
      // - status = completed
      // - autoReassign = true
      const recurringTasks = await Task.find({
        isRecurring: true,
        status: 'completed',
        'recurrence.autoReassign': true,
        dueDate: { $lt: now }
      });

      console.log(`📋 [CRON] Found ${recurringTasks.length} recurring completed tasks`);

      if (recurringTasks.length === 0) {
        console.log('✅ [CRON] No tasks to reassign.\n');
        return;
      }

      let successCount = 0;
      let skipCount = 0;
      const errors = [];

      for (const task of recurringTasks) {
        try {
          const now = new Date();
          const lastCompleted = task.recurrence.lastCompletedAt || task.completedAt || now;

          // Idempotency check: if already reset today, skip
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          if (task.recurrence.lastCompletedAt >= todayStart) {
            console.log(`⏭️  [CRON] Task "${task.title}" already processed today — skipping`);
            skipCount++;
            continue;
          }

          // Calculate next due date
          const nextDueDate = getNextDate(
            task.dueDate || now,
            task.recurrence.type,
            task.recurrence.interval || 1
          );

          // Update task
          await Task.findByIdAndUpdate(task._id, {
            status: 'pending',
            dueDate: nextDueDate,
            pointsAwarded: false,    // Reset so points can be earned again
            completedAt: undefined,
            'recurrence.lastCompletedAt': now
          });

          console.log(`✅ [CRON] Task "${task.title}" reset → pending | Next due: ${nextDueDate.toDateString()}`);
          successCount++;
        } catch (taskError) {
          console.error(`❌ [CRON] Error processing task "${task.title}": ${taskError.message}`);
          errors.push({ taskId: task._id, title: task.title, error: taskError.message });
        }
      }

      const duration = Date.now() - startTime.getTime();
      console.log(`\n📊 [CRON] Summary: ${successCount} reset | ${skipCount} skipped | ${errors.length} errors | ${duration}ms\n`);

    } catch (error) {
      console.error(`❌ [CRON] Fatal error in recurring task job: ${error.message}`);
    }
  }, {
    timezone
  });

  console.log(`⏰ Recurring task cron scheduled (timezone: ${timezone}) — runs daily at 00:00`);
};

module.exports = { startRecurringTaskCron };
