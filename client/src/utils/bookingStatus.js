/** Where a booking is in its life: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'. */
export function getBookingPhase(booking, now = new Date()) {
  if (booking.status === 'cancelled') return 'cancelled';
  if (new Date(booking.endTime) <= now) return 'completed';
  if (new Date(booking.startTime) <= now) return 'in_progress';
  return 'upcoming';
}

export const PHASE_LABELS = {
  upcoming: 'Upcoming',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
