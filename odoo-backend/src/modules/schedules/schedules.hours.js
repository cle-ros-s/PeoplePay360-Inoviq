const { AppError } = require('../../utils/responseFormatter');

/**
 * Converts a "HH:mm" time string into total minutes from midnight
 * @param {string} timeStr - "HH:mm" e.g. "09:00", "18:30"
 * @returns {number} minutes
 */
function parseTimeToMinutes(timeStr) {
  const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(timeStr);
  if (!match) {
    throw new AppError('INVALID_TIME_FORMAT', `Invalid time format: "${timeStr}". Expected "HH:mm".`, 422);
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Calculates hours for a schedule line: (endTime - startTime - breakMinutes) / 60
 * @param {Object} line - { dayOfWeek, startTime, endTime, breakMinutes }
 * @returns {number} calculated hours (rounded to 2 decimal places)
 */
function calculateLineHours(line) {
  const startMinutes = parseTimeToMinutes(line.startTime);
  const endMinutes = parseTimeToMinutes(line.endTime);
  const breakMinutes = Number(line.breakMinutes) || 0;

  if (breakMinutes < 0) {
    throw new AppError('INVALID_BREAK_MINUTES', 'Break minutes cannot be negative', 422);
  }

  if (endMinutes <= startMinutes) {
    throw new AppError(
      'INVALID_SCHEDULE_TIME',
      `End time (${line.endTime}) must be strictly after start time (${line.startTime})`,
      422
    );
  }

  const netMinutes = endMinutes - startMinutes - breakMinutes;
  if (netMinutes < 0) {
    throw new AppError('INVALID_BREAK_DURATION', 'Break duration exceeds working interval', 422);
  }

  return Math.round((netMinutes / 60) * 100) / 100;
}

/**
 * Validates schedule lines and calculates total weekly hours
 * @param {Array} lines - Array of schedule lines
 * @returns {{ processedLines: Array, totalWeeklyHours: number }}
 */
function processScheduleLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new AppError('EMPTY_SCHEDULE', 'Schedule must contain at least one working day line', 422);
  }

  let totalWeeklyHours = 0;
  const processedLines = lines.map((line) => {
    const dayOfWeek = parseInt(line.dayOfWeek, 10);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError('INVALID_DAY_OF_WEEK', 'Day of week must be an integer between 0 (Sun) and 6 (Sat)', 422);
    }

    const hours = calculateLineHours(line);
    totalWeeklyHours += hours;

    return {
      dayOfWeek,
      startTime: line.startTime,
      endTime: line.endTime,
      breakMinutes: Number(line.breakMinutes) || 0,
      hours,
    };
  });

  return {
    processedLines,
    totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
  };
}

module.exports = {
  parseTimeToMinutes,
  calculateLineHours,
  processScheduleLines,
};
