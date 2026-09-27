import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import BookingTabs from '../components/booking/BookingTabs.jsx';
import { bookingsService } from '../services/bookings.service.js';

const EMPTY_STATES = {
  upcoming: {
    title: 'No upcoming bookings',
    hint: 'Find a spot for your next trip.',
    action: { to: '/search', label: 'Find parking' },
  },
  past: { title: 'No past bookings yet', hint: 'Completed bookings will appear here.' },
  cancelled: { title: 'No cancelled bookings', hint: 'Bookings you cancel will appear here.' },
};

export default function MyBookingsPage() {
  return (
    <Container className="py-10 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My bookings</h1>
            <p className="mt-1 text-slate-600">Your parking reservations as a driver.</p>
          </div>
          <Button to="/search">Find parking</Button>
        </div>

        <BookingTabs
          queryKey="driver"
          basePath="/bookings"
          fetcher={bookingsService.mine}
          emptyStates={EMPTY_STATES}
        />
      </div>
    </Container>
  );
}
