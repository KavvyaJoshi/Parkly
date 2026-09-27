const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a number as Indian Rupees, e.g. 12500 -> "₹12,500". */
export function formatINR(amount) {
  return inrFormatter.format(amount);
}

/** Up to two initials from a name, e.g. "Priya Deshmukh" -> "PD". */
export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** 450 -> "450 m", 2394 -> "2.4 km" */
export function formatDistance(meters) {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** "2026-10-05" -> "Mon, 5 Oct" */
export function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Human-friendly duration, e.g. 1 -> "1 hour", 3 -> "3 hours". */
export function formatHours(hours) {
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
