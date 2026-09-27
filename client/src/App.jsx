import { Routes, Route } from 'react-router';

import MainLayout from './layouts/MainLayout.jsx';
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
import NotFoundPage from './pages/NotFoundPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route
          path="list-your-space"
          element={
            <PlaceholderPage
              title="Listing your space is coming soon"
              description="Soon you'll be able to add your parking space, set a price and start earning."
            />
          }
        />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="book/:listingId" element={<CheckoutPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
