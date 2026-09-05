const { parseTimeToMinutes } = require('../schedules/schedules.hours');

/**
 * Derives attendance status based on check-in time, check-out time, and working schedule
 * @param {Date} checkIn - Check-in timestamp
 * @param {Date|null} checkOut - Check-out timestamp
 * @param {Object|null} schedule - WorkingSchedule model with lines
 * @returns {{ workedHours: number|null, status: string }}
 */
function deriveAttendanceStatus(checkIn, checkOut, schedule) {
  if (!checkOut) {
    return {
      workedHours: null,
      status: 'MISSING_CHECKOUT',
    };
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Worked hours in decimal
  const durationMs = checkOutDate.getTime() - checkInDate.getTime();
  const workedHours = Math.max(0, Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100);

  // Default scheduled hours and start time
  let scheduledHours = 8.0;
  let scheduledStartMinutes = 9 * 60; // 09:00 default

  if (schedule && schedule.lines && schedule.lines.length > 0) {
    const dayOfWeek = checkInDate.getDay(); // 0 = Sun, 1 = Mon ...
    const matchingLine = schedule.lines.find((l) => l.dayOfWeek === dayOfWeek);
    if (matchingLine) {
      scheduledHours = matchingLine.hours;
      scheduledStartMinutes = parseTimeToMinutes(matchingLine.startTime);
    }
  }

  // Check-in minutes on the check-in day
  const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();

  // Status precedence:
  // 1. Overtime: workedHours > scheduledHours * 1.1
  // 2. Late: checkIn > scheduledStart + 15 minutes
  // 3. Otherwise: PRESENT
  let status = 'PRESENT';
  if (workedHours > scheduledHours * 1.1) {
    status = 'OVERTIME';
  } else if (checkInMinutes > scheduledStartMinutes + 15) {
    status = 'LATE';
  }

  return {
    workedHours,
    status,
  };
}

module.exports = {
  deriveAttendanceStatus,
};
