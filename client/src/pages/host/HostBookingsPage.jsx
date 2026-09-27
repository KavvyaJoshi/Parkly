import BookingTabs from '../../components/booking/BookingTabs.jsx';
import { ownerService } from '../../services/owner.service.js';

const EMPTY_STATES = {
  upcoming: { title: 'No upcoming bookings', hint: 'When drivers book your spaces, they’ll appear here.' },
  past: { title: 'No completed bookings yet', hint: 'Finished bookings will appear here.' },
  cancelled: { title: 'No cancelled bookings', hint: 'Cancelled bookings on your spaces will appear here.' },
};

export default function HostBookingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Bookings on your spaces</h1>
      <BookingTabs
        queryKey="owner"
        basePath="/host/bookings"
        fetcher={ownerService.bookings}
        emptyStates={EMPTY_STATES}
      />
    </div>
  );
}
