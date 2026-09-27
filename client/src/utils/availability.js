const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "09:00" -> "9:00 AM" */
export function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** [1,2,3,4,5] -> "Mon–Fri", [0,6] -> "Sat & Sun", all days -> "Every day". */
export function formatDays(days = []) {
  const set = new Set(days);
  if (set.size === 7) return 'Every day';
  if (set.size === 0) return 'No days set';

  // Order Monday-first, which reads more naturally.
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => set.has(d));
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Sat & Sun';

  // Consecutive run in Monday-first order, e.g. Mon–Sat.
  const positions = ordered.map((d) => (d + 6) % 7);
  const isRun = positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
  if (isRun && ordered.length > 2) {
    return `${DAY_SHORT[ordered[0]]}–${DAY_SHORT[ordered.at(-1)]}`;
  }
  return ordered.map((d) => DAY_SHORT[d]).join(', ');
}

/** Human summary such as "Open 24×7" or "Mon–Fri, 9:00 AM – 7:00 PM". */
export function formatAvailability(availability) {
  if (!availability) return '';
  if (availability.is24x7) return 'Open 24×7';
  return `${formatDays(availability.days)}, ${formatTime12h(availability.startTime)} – ${formatTime12h(availability.endTime)}`;
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Is the space open for the whole slot? Mirrors the server's search rules.
 * Returns true/false, or null when no complete slot was chosen.
 */
export function isOpenForSlot(availability, { date, time, duration }) {
  if (!availability || !date || !time || !duration) return null;
  if (availability.is24x7) return true;

  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const start = toMinutes(time);
  const end = start + Number(duration) * 60;

  return (
    availability.days.includes(weekday) &&
    end < 24 * 60 &&
    start >= toMinutes(availability.startTime) &&
    end <= toMinutes(availability.endTime)
  );
}
