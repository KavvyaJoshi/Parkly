import { Navigate, Routes, Route } from 'react-router';

import MainLayout from './layouts/MainLayout.jsx';
import HostLayout from './layouts/HostLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import GuestRoute from './routes/GuestRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import BookingDetailPage from './pages/BookingDetailPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import HostOverviewPage from './pages/host/HostOverviewPage.jsx';
import HostListingsPage from './pages/host/HostListingsPage.jsx';
import HostBookingsPage from './pages/host/HostBookingsPage.jsx';
import ListingFormPage from './pages/host/ListingFormPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        {/* Marketing CTA: go straight to the listing form (login first if needed). */}
        <Route path="list-your-space" element={<Navigate to="/host/listings/new" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="book/:listingId" element={<CheckoutPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />

          <Route path="host" element={<HostLayout />}>
            <Route index element={<HostOverviewPage />} />
            <Route path="listings" element={<HostListingsPage />} />
            <Route path="listings/new" element={<ListingFormPage />} />
            <Route path="listings/:id/edit" element={<ListingFormPage />} />
            <Route path="bookings" element={<HostBookingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
