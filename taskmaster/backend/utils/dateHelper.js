
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

      if (date.getDate() !== originalDay) {
        date.setDate(0); 
      }
      break;
    }

    default:
      date.setDate(date.getDate() + 1);
  }

  return date;
};

module.exports = { getNextDate };
