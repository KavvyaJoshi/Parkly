import { useState } from 'react';
import { BadgeIndianRupee, CalendarClock, Car, ClipboardList, MapPinned, Search } from 'lucide-react';

import Container from '../ui/Container.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';

const STEPS = {
  drivers: [
    {
      icon: Search,
      title: 'Search where you’re headed',
      text: 'Enter an area or landmark with your date, start time and how long you’ll stay.',
    },
    {
      icon: CalendarClock,
      title: 'Pick a spot and book',
      text: 'Compare hourly prices, photos, amenities and rules. See the full price before you confirm.',
    },
    {
      icon: Car,
      title: 'Drive in and park',
      text: 'Your spot is reserved for your time slot. Follow the owner’s directions and park.',
    },
  ],
  owners: [
    {
      icon: ClipboardList,
      title: 'List your space',
      text: 'Add the address, photos, amenities and any rules. It only takes a few minutes.',
    },
    {
      icon: MapPinned,
      title: 'Set your price and hours',
      text: 'Choose your hourly rate and when the space is available. Pause your listing any time.',
    },
    {
      icon: BadgeIndianRupee,
      title: 'Get booked and earn',
      text: 'Drivers book the hours you’ve made available. Track bookings and earnings from your dashboard.',
    },
  ],
};

const AUDIENCES = [
  { key: 'drivers', label: 'For drivers' },
  { key: 'owners', label: 'For space owners' },
];

export default function HowItWorks() {
  const [audience, setAudience] = useState('drivers');

  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-16 py-20 sm:py-24">
      <Container>
        <SectionHeading
          id="how-heading"
          eyebrow="How it works"
          title="Parking sorted in three steps"
          description="Whether you need a spot or have one to spare, Parkly keeps it simple."
        />

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Show steps for">
            {AUDIENCES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={audience === key}
                onClick={() => setAudience(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
                  audience === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS[audience].map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-400">Step {index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
