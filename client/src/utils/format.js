const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a number as Indian Rupees, e.g. 12500 -> "₹12,500". */
export function formatINR(amount) {
  return inrFormatter.format(amount);
}

/** Human-friendly duration, e.g. 1 -> "1 hour", 3 -> "3 hours". */
export function formatHours(hours) {
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
