import { PHASE_LABELS, getBookingPhase } from '../../utils/bookingStatus.js';

const STYLES = {
  upcoming: 'bg-brand-50 text-brand-700 ring-brand-200',
  in_progress: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

export default function BookingStatusBadge({ booking, className = '' }) {
  const phase = getBookingPhase(booking);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[phase]} ${className}`}>
      {PHASE_LABELS[phase]}
    </span>
  );
}
