import { Camera, CheckCircle2, MapPin, ShieldCheck, Umbrella } from 'lucide-react';
import { formatINR } from '../../utils/format.js';

// Decorative mock of the booking experience. Hidden from assistive tech
// because it illustrates the product rather than being real, interactive UI.
export default function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200 via-sky-100 to-emerald-100 opacity-70 blur-2xl" />

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 shadow-brand-900/15 ring-slate-200">
        {/* Stylised map */}
        <div className="relative h-44 bg-slate-100">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="absolute top-0 left-1/3 h-full w-5 -skew-x-12 bg-white" />
          <div className="absolute top-1/2 left-0 h-5 w-full -translate-y-1/2 bg-white" />
          <div className="absolute top-6 right-8 h-12 w-16 rounded-lg bg-emerald-100" />
          <div className="absolute bottom-5 left-6 h-10 w-20 rounded-lg bg-sky-100" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                {formatINR(40)}/hr
              </span>
              <span className="-mt-1 h-3 w-3 rotate-45 bg-brand-600" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Covered society parking</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                Baner, Pune · 450 m away
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Demo
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: Umbrella, label: 'Covered' },
              { icon: Camera, label: 'CCTV' },
              { icon: ShieldCheck, label: 'Gated' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div>
              <p className="text-slate-500">Today · 10:00 – 12:00</p>
              <p className="font-semibold text-slate-900">2 hours × {formatINR(40)}</p>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatINR(80)}</p>
          </div>

          <div className="mt-4 rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white">
            Book this spot
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200 sm:-left-8">
        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Booking confirmed</p>
          <p className="text-xs text-slate-500">Spot reserved for you</p>
        </div>
      </div>
    </div>
  );
}
