import { CalendarCheck, IndianRupee, MapPin } from 'lucide-react';

import Container from '../ui/Container.jsx';

const POINTS = [
  { icon: MapPin, text: 'Private parking across Pune, bookable by the hour' },
  { icon: CalendarCheck, text: 'Reserve before you leave and skip the search' },
  { icon: IndianRupee, text: 'List your own space for free and earn from it' },
];

/** Two-column layout for login/signup: form on the left, brand panel on the right. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 shadow-slate-900/5 ring-slate-200 lg:grid-cols-2">
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold tracking-wide text-brand-300 uppercase">Parkly</p>
            <p className="mt-3 text-2xl leading-snug font-semibold">
              Parking that’s already there, whenever you need it.
            </p>
          </div>
          <ul className="relative space-y-5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-brand-200" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-brand-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
