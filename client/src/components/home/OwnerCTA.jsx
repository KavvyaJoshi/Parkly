import { ArrowRight, Check } from 'lucide-react';

import Button from '../ui/Button.jsx';
import Container from '../ui/Container.jsx';
import EarningsEstimator from './EarningsEstimator.jsx';

const POINTS = [
  'Free to list — no upfront costs',
  'You choose the price and the hours',
  'Pause or edit your listing any time',
  'See every booking and your earnings in one dashboard',
];

export default function OwnerCTA() {
  return (
    <section
      id="list-your-space"
      aria-labelledby="owner-heading"
      className="scroll-mt-16 bg-brand-950 py-20 text-white sm:py-24"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand-300 uppercase">
              For space owners
            </p>
            <h2 id="owner-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Your empty parking spot could be earning for you
            </h2>
            <p className="mt-4 text-lg text-brand-100">
              Driveways, society slots, shop fronts after hours, office parking on weekends — if a
              car fits, drivers nearby are looking for it.
            </p>

            <ul className="mt-8 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                    <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                  </span>
                  <span className="text-brand-50">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button to="/list-your-space" variant="light" size="lg">
                List your space
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button to="/#how-it-works" variant="outlineLight" size="lg">
                See how it works
              </Button>
            </div>
          </div>

          <EarningsEstimator />
        </div>
      </Container>
    </section>
  );
}
