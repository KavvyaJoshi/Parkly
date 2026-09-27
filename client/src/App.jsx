import { Routes, Route, Link } from 'react-router';
import { Car, MapPin } from 'lucide-react';

function ComingSoon() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
        <Car className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Parkly</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Hourly parking in private spaces — find a spot near you, or earn from the one you
        don&apos;t use.
      </p>
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Launching first in Pune
      </p>
    </main>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <Link to="/" className="mt-6 font-medium text-brand-600 hover:text-brand-700">
        Back to home
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ComingSoon />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
