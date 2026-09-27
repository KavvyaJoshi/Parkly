import { useId, useState } from 'react';
import { Crosshair, ExternalLink } from 'lucide-react';

import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import FormField from '../ui/FormField.jsx';
import Spinner from '../ui/Spinner.jsx';
import { AMENITIES, SPACE_TYPES, VEHICLE_SIZES } from '../../constants/listing.js';
import { PUNE_AREAS } from '../../data/areas.js';
import { ApiError } from '../../services/api.js';
import {
  ALL_DAYS,
  DAY_LABELS,
  applyAreaChange,
  initialFormValues,
  mapServerErrors,
  toPayload,
  validateListing,
} from './listingFormModel.js';

const SPACE_TYPE_HINTS = {
  driveway: 'In front of a house or bungalow',
  society: 'A slot in an apartment complex',
  garage: 'An enclosed, lockable space',
  commercial: 'Office or shop parking',
  open_lot: 'An open plot of land',
};

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600">
      {children}
    </p>
  );
}

/**
 * Create/edit form for a parking space. `onSubmit(payload, { publish })` must return a promise;
 * throw an ApiError to show server validation errors.
 */
export default function ListingForm({ listing, onSubmit }) {
  const id = useId();
  const isEdit = Boolean(listing);
  const [values, setValues] = useState(() => initialFormValues(listing));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (patch) => {
    setValues((prev) => ({ ...prev, ...patch }));
    const cleared = Object.keys(patch);
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !cleared.includes(k))));
  };
  const onInput = (e) => set({ [e.target.name]: e.target.value });

  const toggleInList = (key, item) =>
    set({ [key]: values[key].includes(item) ? values[key].filter((x) => x !== item) : [...values[key], item] });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Your browser can’t share its location. Enter coordinates manually.' }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        set({ lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6), locationSource: 'gps', location: undefined });
      },
      () => {
        setLocating(false);
        setErrors((prev) => ({ ...prev, location: 'Couldn’t get your location. Allow location access or enter coordinates manually.' }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const publish = e.nativeEvent.submitter?.value === 'publish';
    setFormError('');

    const clientErrors = validateListing(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setFormError('Please fix the highlighted fields.');
      // Focus the first invalid field once React has rendered the error states.
      const form = e.currentTarget;
      setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values), { publish });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(mapServerErrors(err.fieldErrors));
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(err.message);
      }
      setSubmitting(false);
    }
  };

  const areaInfo = PUNE_AREAS.find((a) => a.name === values.area);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${values.lat},${values.lng}`;
  const pinDescription =
    values.locationSource === 'area'
      ? `Centre of ${values.area}. For accuracy, use your current location while at the space.`
      : values.locationSource === 'gps'
        ? 'Set from your current location.'
        : 'Saved location.';

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && <Alert tone="error">{formError}</Alert>}

      <Section title="The basics" description="Help drivers understand what kind of space this is.">
        <FormField
          label="Title"
          name="title"
          placeholder="e.g. Covered society parking near Baner High Street"
          maxLength={100}
          value={values.title}
          onChange={onInput}
          error={errors.title}
          required
        />
        <div>
          <label htmlFor={`${id}-description`} className="form-label">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id={`${id}-description`}
            name="description"
            rows={4}
            maxLength={1000}
            placeholder="Anything drivers should know: access, surface, how to find the spot…"
            value={values.description}
            onChange={onInput}
            className="form-input py-3"
          />
        </div>

        <fieldset>
          <legend className="form-label">Type of space</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(SPACE_TYPES).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                  values.spaceType === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="spaceType"
                  value={value}
                  checked={values.spaceType === value}
                  onChange={onInput}
                  className="sr-only"
                />
                <span className="font-medium text-slate-900">{label}</span>{' '}
                <span className="mt-0.5 text-sm text-slate-500">{SPACE_TYPE_HINTS[value]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="form-label">Largest vehicle that fits</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(VEHICLE_SIZES).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <input
                  type="radio"
                  name="vehicleSize"
                  value={value}
                  checked={values.vehicleSize === value}
                  onChange={onInput}
                  className="h-4 w-4 accent-brand-600"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Location" description="The full address is only shown to drivers after they book.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-area`} className="form-label">
              Area
            </label>
            <select
              id={`${id}-area`}
              name="area"
              value={values.area}
              onChange={(e) => setValues((prev) => applyAreaChange(prev, e.target.value))}
              className="form-input"
            >
              {PUNE_AREAS.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-sm text-slate-500">Parkly currently operates in these Pune areas.</p>
          </div>
          <FormField
            label="PIN code"
            name="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={values.pincode}
            onChange={onInput}
            error={errors.pincode}
            required
          />
        </div>
        <FormField
          label="Street address"
          name="line1"
          autoComplete="address-line1"
          placeholder="Building / society name, lane, road"
          value={values.line1}
          onChange={onInput}
          error={errors.line1}
          required
        />
        <FormField
          label="Landmark"
          name="landmark"
          optional
          placeholder="e.g. Opposite the petrol pump, next to Gate 2"
          value={values.landmark}
          onChange={onInput}
          error={errors.landmark}
        />

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Map pin</p>
          <p className="mt-1 font-mono text-sm text-slate-700">
            {Number(values.lat).toFixed(5)}, {Number(values.lng).toFixed(5)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{pinDescription}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={useCurrentLocation} disabled={locating}>
              {locating ? <Spinner className="h-4 w-4" /> : <Crosshair className="h-4 w-4" aria-hidden="true" />}
              Use my current location
            </Button>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Check on Google Maps
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-600">Enter coordinates manually</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FormField
                label="Latitude"
                name="lat"
                inputMode="decimal"
                value={values.lat}
                onChange={(e) => set({ lat: e.target.value, locationSource: 'manual', location: undefined })}
              />
              <FormField
                label="Longitude"
                name="lng"
                inputMode="decimal"
                value={values.lng}
                onChange={(e) => set({ lng: e.target.value, locationSource: 'manual', location: undefined })}
              />
            </div>
          </details>
          <FieldError id={`${id}-location-error`}>{errors.location}</FieldError>
        </div>
      </Section>

      <Section title="Price and availability">
        <div className="max-w-xs">
          <FormField
            label="Price per hour (₹)"
            name="pricePerHour"
            type="number"
            inputMode="numeric"
            min={10}
            max={1000}
            step={5}
            value={values.pricePerHour}
            onChange={onInput}
            error={errors.pricePerHour}
            hint={areaInfo ? `Demo spaces in ${values.area} start from ₹${areaInfo.fromPrice}/hr.` : undefined}
            required
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-900">
          <input
            type="checkbox"
            checked={values.is24x7}
            onChange={(e) => set({ is24x7: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
          Available 24×7
        </label>

        {!values.is24x7 && (
          <>
            <fieldset aria-describedby={errors.days ? `${id}-days-error` : undefined}>
              <legend className="form-label">Days available</legend>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const on = values.days.includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex h-11 w-14 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                        on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => toggleInList('days', day)}
                      />
                      {DAY_LABELS[day]}
                    </label>
                  );
                })}
              </div>
              <FieldError id={`${id}-days-error`}>{errors.days}</FieldError>
            </fieldset>

            <div className="grid max-w-md grid-cols-2 gap-4">
              <FormField label="Opens at" name="startTime" type="time" step="1800" value={values.startTime} onChange={onInput} />
              <FormField
                label="Closes at"
                name="endTime"
                type="time"
                step="1800"
                value={values.endTime}
                onChange={onInput}
                error={errors.endTime}
              />
            </div>
          </>
        )}
      </Section>

      <Section title="Amenities and rules">
        <fieldset>
          <legend className="form-label">Amenities</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(AMENITIES).map(([value, { label, icon: Icon }]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={values.amenities.includes(value)}
                  onChange={() => toggleInList('amenities', value)}
                  className="h-4 w-4 accent-brand-600"
                />
                <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`${id}-rules`} className="form-label">
            House rules <span className="font-normal text-slate-400">(optional, one per line)</span>
          </label>
          <textarea
            id={`${id}-rules`}
            name="rulesText"
            rows={4}
            placeholder={'No overnight parking\nShow your booking to the security guard'}
            value={values.rulesText}
            onChange={onInput}
            aria-invalid={Boolean(errors.rulesText)}
            aria-describedby={errors.rulesText ? `${id}-rules-error` : undefined}
            className="form-input py-3"
          />
          <FieldError id={`${id}-rules-error`}>{errors.rulesText}</FieldError>
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {isEdit ? (
          <Button type="submit" size="lg" value="save" disabled={submitting}>
            {submitting && <Spinner />}
            Save changes
          </Button>
        ) : (
          <>
            <Button type="submit" size="lg" variant="secondary" value="draft" disabled={submitting}>
              Save as draft
            </Button>
            <Button type="submit" size="lg" value="publish" disabled={submitting}>
              {submitting && <Spinner />}
              Publish listing
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
