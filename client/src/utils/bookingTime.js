// Booking times come from the API as UTC ISO strings; always show them in Pune time.
const TZ = 'Asia/Kolkata';

const dateFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

export const formatBookingDate = (iso) => dateFmt.format(new Date(iso));
export const formatBookingTime = (iso) => timeFmt.format(new Date(iso)).toUpperCase();

/** "Mon, 5 Oct 2026 · 10:00 AM – 12:00 PM" (both dates shown if it runs past midnight). */
export function formatBookingRange(startIso, endIso) {
  const sameDay = dayKeyFmt.format(new Date(startIso)) === dayKeyFmt.format(new Date(endIso));
  if (sameDay) {
    return `${formatBookingDate(startIso)} · ${formatBookingTime(startIso)} – ${formatBookingTime(endIso)}`;
  }
  return `${formatBookingDate(startIso)} ${formatBookingTime(startIso)} – ${formatBookingDate(endIso)} ${formatBookingTime(endIso)}`;
}

/** Normalise a vehicle number as the user types: uppercase, no spaces or dashes. */
export const normalizeVehicleNumber = (value) => value.toUpperCase().replace(/[\s-]/g, '');

const PLATE_RE = /^([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/;
export const isValidVehicleNumber = (value) => PLATE_RE.test(normalizeVehicleNumber(value));
