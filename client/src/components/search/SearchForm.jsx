import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, MapPin, Search } from 'lucide-react';

import Button from '../ui/Button.jsx';
import { PUNE_AREAS, DURATION_OPTIONS } from '../../data/areas.js';
import { formatHours } from '../../utils/format.js';
import {
  combineDateAndTime,
  getNextSlot,
  toDateInputValue,
  toTimeInputValue,
} from '../../utils/datetime.js';

function getInitialValues() {
  const slot = getNextSlot();
  return {
    location: '',
    date: toDateInputValue(slot),
    time: toTimeInputValue(slot),
    duration: '2',
  };
}

export default function SearchForm() {
  const id = useId();
  const navigate = useNavigate();
  const [values, setValues] = useState(getInitialValues);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const location = values.location.trim();
    if (!location) {
      setError('Enter an area or landmark to search for parking.');
      return;
    }
    if (combineDateAndTime(values.date, values.time) < new Date()) {
      setError('That start time has already passed. Choose a time in the future.');
      return;
    }

    const params = new URLSearchParams({ ...values, location });
    navigate(`/search?${params}`);
  };

  const today = toDateInputValue(new Date());

  return (
    <form
      role="search"
      aria-label="Search for parking"
      action="/search"
      method="get"
      noValidate
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-4 shadow-xl ring-1 shadow-slate-900/10 ring-slate-200 sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="md:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-location`} className="form-label">
            Where are you going?
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id={`${id}-location`}
              name="location"
              type="text"
              list={`${id}-areas`}
              placeholder="e.g. Baner, Hinjawadi Phase 1"
              autoComplete="off"
              enterKeyHint="search"
              required
              aria-invalid={Boolean(error) && !values.location.trim()}
              aria-describedby={`${id}-error`}
              value={values.location}
              onChange={handleChange}
              className="form-input pl-11"
            />
            <datalist id={`${id}-areas`}>
              {PUNE_AREAS.map((area) => (
                <option key={area.name} value={area.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-date`} className="form-label">
            Date
          </label>
          <input
            id={`${id}-date`}
            name="date"
            type="date"
            min={today}
            required
            value={values.date}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor={`${id}-time`} className="form-label">
            Start time
          </label>
          <input
            id={`${id}-time`}
            name="time"
            type="time"
            step="1800"
            required
            value={values.time}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor={`${id}-duration`} className="form-label">
            Duration
          </label>
          <div className="relative">
            <Clock
              className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <select
              id={`${id}-duration`}
              name="duration"
              value={values.duration}
              onChange={handleChange}
              className="form-input pl-11"
            >
              {DURATION_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {formatHours(hours)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button type="submit" size="lg" className="min-h-12 w-full md:col-span-2 lg:col-span-1 lg:w-auto">
          <Search className="h-5 w-5" aria-hidden="true" />
          Find parking
        </Button>
      </div>

      <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-600 empty:hidden mt-3">
        {error}
      </p>
    </form>
  );
}
