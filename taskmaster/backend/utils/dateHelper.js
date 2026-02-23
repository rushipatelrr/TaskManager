/**
 * Calculate the next due date for a recurring task.
 * Handles edge cases: monthly overflow, leap year, etc.
 */
const getNextDate = (currentDate, recurrenceType, interval = 1) => {
  const date = new Date(currentDate);

  switch (recurrenceType) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;

    case 'weekly':
      date.setDate(date.getDate() + interval * 7);
      break;

    case 'monthly': {
      const originalDay = date.getDate();
      date.setMonth(date.getMonth() + interval);

      // Handle month overflow (e.g., Jan 31 + 1 month → Feb 28/29)
      if (date.getDate() !== originalDay) {
        date.setDate(0); // Go to last day of previous month
      }
      break;
    }

    default:
      date.setDate(date.getDate() + 1);
  }

  return date;
};

module.exports = { getNextDate };
