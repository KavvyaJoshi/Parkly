import { toMinutes, weekdayOf } from './time.js';

/**
 * Does a slot (date, "HH:MM" start, duration in hours) fall entirely inside a space's weekly hours?
 * Slots that run past midnight are only allowed at 24x7 spaces.
 */
export function fitsSchedule(availability, { date, time, duration }) {
  if (availability.is24x7) return true;

  const start = toMinutes(time);
  const end = start + duration * 60;
  return (
    availability.days.includes(weekdayOf(date)) &&
    end < 24 * 60 &&
    start >= toMinutes(availability.startTime) &&
    end <= toMinutes(availability.endTime)
  );
}
