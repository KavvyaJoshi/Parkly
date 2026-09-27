// Parkly operates in India, so booking dates/times from users are Indian Standard Time
// (UTC+5:30, no daylight saving) regardless of the server's own time zone.
const IST_OFFSET_MS = 330 * 60 * 1000;
export const SLOT_MINUTES = 30;

/** "2026-10-05" + "10:30" (IST) -> Date */
export function istToDate(date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS);
}

/** Day of the week (0 = Sunday) for a YYYY-MM-DD date. */
export function weekdayOf(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Start times of every 30-minute slot in [start, end). */
export function slotStarts(start, end) {
  const slots = [];
  for (let t = start.getTime(); t < end.getTime(); t += SLOT_MINUTES * 60 * 1000) {
    slots.push(new Date(t));
  }
  return slots;
}
