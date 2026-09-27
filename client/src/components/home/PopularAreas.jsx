import { Link } from 'react-router';
import { ArrowUpRight, MapPin } from 'lucide-react';

import Container from '../ui/Container.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { PUNE_AREAS } from '../../data/areas.js';
import { formatINR } from '../../utils/format.js';

const TILE_COLORS = [
  'from-brand-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

export default function PopularAreas() {
  return (
    <section
      id="popular-areas"
      aria-labelledby="areas-heading"
      className="scroll-mt-16 py-20 sm:py-24"
    >
      <Container>
        <SectionHeading
          id="areas-heading"
          eyebrow="Popular in Pune"
          title="Find parking across the city"
          description="From IT parks to high streets, start your search in Pune’s busiest neighbourhoods."
        />

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PUNE_AREAS.map((area, index) => (
            <li key={area.name}>
              <Link
                to={`/search?${new URLSearchParams({ location: area.name })}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className={`flex h-20 items-end bg-gradient-to-br p-4 ${TILE_COLORS[index % TILE_COLORS.length]}`}
                >
                  <MapPin className="h-6 w-6 text-white/90" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{area.name}</h3>
                    <ArrowUpRight
                      className="h-4 w-4 text-slate-400 transition group-hover:text-brand-600"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 flex-1 text-sm text-slate-500">{area.description}</p>
                  <p className="mt-3 text-sm text-slate-700">
                    from <span className="font-semibold text-slate-900">{formatINR(area.fromPrice)}</span>/hr
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-slate-500">
          Prices shown are indicative demo rates. Actual prices are set by each space owner.
        </p>
      </Container>
    </section>
  );
}
