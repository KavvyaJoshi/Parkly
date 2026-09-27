import { ArrowRight, BadgeIndianRupee, CalendarCheck, Home } from 'lucide-react';

import Button from '../ui/Button.jsx';
import Container from '../ui/Container.jsx';
import SearchForm from '../search/SearchForm.jsx';
import HeroPreview from './HeroPreview.jsx';

const HIGHLIGHTS = [
  { icon: BadgeIndianRupee, label: 'Pay only by the hour' },
  { icon: CalendarCheck, label: 'Reserve before you leave' },
  { icon: Home, label: 'Free to list your space' },
];

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
      <div className="absolute -top-40 -right-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-brand-100/60 blur-3xl" />

      <Container className="pt-12 pb-16 sm:pt-20 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Now launching in Pune
            </p>

            <h1
              id="hero-heading"
              className="mt-6 text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Stop circling. <span className="text-brand-600">Book a parking spot</span> before you
              arrive.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-pretty text-slate-600">
              Parkly connects drivers with private driveways, society parking and office spaces that
              sit empty during the day. Find a spot by the hour — or earn from the one you don&apos;t use.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/search" size="lg">
                Find parking
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button to="/list-your-space" variant="secondary" size="lg">
                List your space
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <HeroPreview />
          </div>
        </div>

        <div className="mt-12 lg:mt-20">
          <SearchForm />
        </div>
      </Container>
    </section>
  );
}
