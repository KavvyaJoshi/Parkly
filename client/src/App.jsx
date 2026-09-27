import { Routes, Route } from 'react-router';

import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="search"
          element={
            <PlaceholderPage
              title="Search is on its way"
              description="Browsing and filtering parking spaces in Pune is coming soon."
            />
          }
        />
        <Route
          path="list-your-space"
          element={
            <PlaceholderPage
              title="Listing your space is coming soon"
              description="Soon you'll be able to add your parking space, set a price and start earning."
            />
          }
        />
        <Route
          path="login"
          element={<PlaceholderPage title="Log in" description="Accounts are coming soon." />}
        />
        <Route
          path="signup"
          element={<PlaceholderPage title="Create an account" description="Accounts are coming soon." />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
