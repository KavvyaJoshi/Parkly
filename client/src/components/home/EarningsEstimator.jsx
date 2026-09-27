import { useId, useState } from 'react';
import { formatINR } from '../../utils/format.js';

const DAYS_PER_MONTH = 25;

export default function EarningsEstimator() {
  const id = useId();
  const [price, setPrice] = useState(40);
  const [hoursPerDay, setHoursPerDay] = useState(6);

  const monthly = price * hoursPerDay * DAYS_PER_MONTH;

  return (
    <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
      <h3 className="text-lg font-semibold">Estimate your monthly earnings</h3>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-price`} className="text-sm font-medium text-slate-700">
              Hourly price
            </label>
            <output htmlFor={`${id}-price`} className="text-sm font-semibold">
              {formatINR(price)}/hr
            </output>
          </div>
          <input
            id={`${id}-price`}
            type="range"
            min="20"
            max="150"
            step="5"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-3 w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-hours`} className="text-sm font-medium text-slate-700">
              Hours booked per day
            </label>
            <output htmlFor={`${id}-hours`} className="text-sm font-semibold">
              {hoursPerDay} hrs
            </output>
          </div>
          <input
            id={`${id}-hours`}
            type="range"
            min="1"
            max="12"
            step="1"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="mt-3 w-full"
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-brand-50 p-5">
        <p className="text-sm text-slate-600">Potential earnings per month</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-brand-700" aria-live="polite">
          {formatINR(monthly)}
        </p>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Illustrative estimate based on {DAYS_PER_MONTH} booked days a month, before any fees.
        Actual earnings depend on demand in your area.
      </p>
    </div>
  );
}
