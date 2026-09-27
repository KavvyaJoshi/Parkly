import { useId } from 'react';

import {
  AMENITIES,
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  SPACE_TYPES,
  VEHICLE_SIZES,
} from '../../constants/listing.js';
import { formatINR } from '../../utils/format.js';

const csvToSet = (value) => new Set((value ?? '').split(',').filter(Boolean));

function Fieldset({ legend, children }) {
  return (
    <fieldset className="border-t border-slate-200 pt-5">
      <legend className="float-left mb-3 w-full text-sm font-semibold text-slate-900">{legend}</legend>
      <div className="clear-both space-y-2.5">{children}</div>
    </fieldset>
  );
}

function Check({ type = 'checkbox', name, value, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-brand-600"
      />
      {children}
    </label>
  );
}

/**
 * Search filters. Reads current values from `params` (URLSearchParams) and
 * reports changes as { key: value | null } via `onChange` (null removes a filter).
 */
export default function FilterPanel({ params, onChange, onClear, hasCenter }) {
  const id = useId();
  const amenities = csvToSet(params.get('amenities'));
  const spaceTypes = csvToSet(params.get('spaceType'));

  const toggleInCsv = (key, set, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ [key]: next.size ? [...next].join(',') : null });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={onClear} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Clear all
        </button>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <label htmlFor={`${id}-price`} className="text-sm font-semibold text-slate-900">
          Maximum price
        </label>
        <select
          id={`${id}-price`}
          value={params.get('maxPrice') ?? ''}
          onChange={(e) => onChange({ maxPrice: e.target.value || null })}
          className="form-input mt-3"
        >
          <option value="">Any price</option>
          {PRICE_OPTIONS.map((price) => (
            <option key={price} value={price}>
              Up to {formatINR(price)}/hr
            </option>
          ))}
        </select>
      </div>

      {hasCenter && (
        <div className="border-t border-slate-200 pt-5">
          <label htmlFor={`${id}-radius`} className="text-sm font-semibold text-slate-900">
            Distance
          </label>
          <select
            id={`${id}-radius`}
            value={params.get('radius') ?? '3'}
            onChange={(e) => onChange({ radius: e.target.value === '3' ? null : e.target.value })}
            className="form-input mt-3"
          >
            {RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
          </select>
        </div>
      )}

      <Fieldset legend="Your vehicle">
        <Check
          type="radio"
          name={`${id}-vehicle`}
          value=""
          checked={!params.get('vehicleSize')}
          onChange={() => onChange({ vehicleSize: null })}
        >
          Any size
        </Check>
        {Object.entries(VEHICLE_SIZES).map(([value, label]) => (
          <Check
            key={value}
            type="radio"
            name={`${id}-vehicle`}
            value={value}
            checked={params.get('vehicleSize') === value}
            onChange={() => onChange({ vehicleSize: value })}
          >
            {label}
          </Check>
        ))}
      </Fieldset>

      <Fieldset legend="Availability">
        <Check
          checked={params.get('is24x7') === 'true'}
          onChange={(e) => onChange({ is24x7: e.target.checked ? 'true' : null })}
        >
          Open 24×7
        </Check>
      </Fieldset>

      <Fieldset legend="Amenities">
        {Object.entries(AMENITIES).map(([value, { label }]) => (
          <Check
            key={value}
            checked={amenities.has(value)}
            onChange={() => toggleInCsv('amenities', amenities, value)}
          >
            {label}
          </Check>
        ))}
      </Fieldset>

      <Fieldset legend="Type of space">
        {Object.entries(SPACE_TYPES).map(([value, label]) => (
          <Check
            key={value}
            checked={spaceTypes.has(value)}
            onChange={() => toggleInCsv('spaceType', spaceTypes, value)}
          >
            {label}
          </Check>
        ))}
      </Fieldset>
    </div>
  );
}
