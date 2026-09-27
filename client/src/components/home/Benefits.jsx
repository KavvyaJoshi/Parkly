import { Clock, Eye, IndianRupee, SlidersHorizontal, ToggleRight, Zap } from 'lucide-react';

import Container from '../ui/Container.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';

const BENEFITS = [
  {
    icon: IndianRupee,
    title: 'Pay only for the hours you need',
    text: 'Hourly pricing set by each space owner. No monthly passes, no long-term commitments.',
  },
  {
    icon: Clock,
    title: 'Reserve ahead of time',
    text: 'Book before you leave home so you’re not hunting for a spot at a busy junction.',
  },
  {
    icon: Eye,
    title: 'Know exactly what you’re getting',
    text: 'Photos, directions, amenities and house rules on every listing, with the total price upfront.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filter for what matters',
    text: 'Narrow results by price, covered parking, CCTV, EV charging or 24×7 access.',
  },
  {
    icon: ToggleRight,
    title: 'Owners stay in control',
    text: 'Set your own price and available hours, and publish or pause your listing whenever you like.',
  },
  {
    icon: Zap,
    title: 'Put idle space to work',
    text: 'That empty spot while you’re at the office or out of town can earn money instead.',
  },
];

export default function Benefits() {
  return (
    <section aria-labelledby="benefits-heading" className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <SectionHeading
          id="benefits-heading"
          eyebrow="Why Parkly"
          title="Parking that works for both sides"
          description="A fairer way to use the parking that already exists in our cities."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
