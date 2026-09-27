const pad = (n) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD (the format <input type="date"> expects). */
export function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local time as HH:MM (the format <input type="time"> expects). */
export function toTimeInputValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The next half-hour slot from `now`, e.g. 10:07 -> 10:30, 10:40 -> 11:00. */
export function getNextSlot(now = new Date()) {
  const slot = new Date(now);
  slot.setSeconds(0, 0);
  const minutes = slot.getMinutes();
  slot.setMinutes(minutes < 30 ? 30 : 60);
  return slot;
}

/** Combine YYYY-MM-DD and HH:MM strings into a local Date. */
export function combineDateAndTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}
