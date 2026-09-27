import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { CalendarDays, SearchX, SlidersHorizontal } from 'lucide-react';

import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';
import SearchForm from '../components/search/SearchForm.jsx';
import FilterPanel from '../components/search/FilterPanel.jsx';
import ListingCard from '../components/search/ListingCard.jsx';
import Pagination from '../components/search/Pagination.jsx';
import ResultsSkeleton from '../components/search/ResultsSkeleton.jsx';
import { SORT_OPTIONS } from '../constants/listing.js';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { listingsService } from '../services/listings.service.js';
import { formatTime12h } from '../utils/availability.js';
import { formatHours, formatShortDate } from '../utils/format.js';

const SLOT_KEYS = ['date', 'time', 'duration'];
const FILTER_KEYS = ['maxPrice', 'radius', 'vehicleSize', 'is24x7', 'amenities', 'spaceType'];

function resultsHeading({ total, center, location }) {
  const count = `${total} parking ${total === 1 ? 'space' : 'spaces'}`;
  if (center) return `${count} near ${center.label}`;
  if (location) return `${count} matching “${location}”`;
  return `${count} in Pune`;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const queryString = params.toString();

  const { data, error, isLoading, retry } = useApiQuery(queryString, () => listingsService.search(params));

  const location = params.get('location') ?? '';
  const slot = Object.fromEntries(SLOT_KEYS.map((key) => [key, params.get(key)]));
  const slotParams = new URLSearchParams(
    Object.entries(slot).filter(([, value]) => value),
  ).toString();
  const activeFilterCount = FILTER_KEYS.filter((key) => params.get(key)).length;

  /** Apply { key: value | null } changes; any change except paging resets to page 1. */
  const updateParams = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const clearFilters = () => updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])));

  const goToPage = (page) => {
    updateParams({ page: page > 1 ? String(page) : null }, { keepPage: true });
    window.scrollTo({ top: 0 });
  };

  const hasCenter = Boolean(data?.center);
  const sortOptions = SORT_OPTIONS.filter((o) => o.value !== 'distance' || hasCenter);
  const listings = data?.listings ?? [];

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <Container className="py-5">
          <SearchForm
            key={SLOT_KEYS.concat('location').map((k) => params.get(k)).join('|')}
            initialValues={{ location, ...Object.fromEntries(Object.entries(slot).filter(([, v]) => v)) }}
            requireLocation={false}
            preserveParams={params}
            className="shadow-none"
          />
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:block" aria-label="Search filters">
            <Button
              variant="secondary"
              className="w-full lg:hidden"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {showFilters ? 'Hide filters' : 'Filters'}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
              )}
            </Button>
            <div
              id="filter-panel"
              className={`${showFilters ? 'mt-4 block' : 'hidden'} rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky lg:top-24 lg:mt-0 lg:block`}
            >
              <FilterPanel params={params} onChange={updateParams} onClear={clearFilters} hasCenter={hasCenter} />
            </div>
          </aside>

          <section aria-labelledby="results-heading" aria-busy={isLoading}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 id="results-heading" className="text-2xl font-bold tracking-tight text-slate-900">
                  {data ? resultsHeading({ total: data.pagination.total, center: data.center, location }) : 'Searching…'}
                </h1>
                {slot.date && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {formatShortDate(slot.date)}
                    {slot.time && ` · from ${formatTime12h(slot.time)}`}
                    {slot.duration && ` · ${formatHours(Number(slot.duration))}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm whitespace-nowrap text-slate-600">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={params.get('sort') ?? 'relevance'}
                  onChange={(e) => updateParams({ sort: e.target.value === 'relevance' ? null : e.target.value })}
                  className="form-input min-h-10 w-auto py-1.5 text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              {error && (
                <Alert tone="error">
                  <p>{error.message}</p>
                  <button type="button" onClick={retry} className="mt-2 font-semibold underline">
                    Try again
                  </button>
                </Alert>
              )}

              {!error && !data && <ResultsSkeleton />}

              {!error && data && listings.length === 0 && (
                <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
                  <SearchX className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">No parking spaces match</h2>
                  <p className="mt-1 text-slate-600">
                    Try a different time, a wider distance, or fewer filters.
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="secondary" className="mt-6" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {!error && listings.length > 0 && (
                <>
                  <ul className={`space-y-4 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                    {listings.map((listing) => (
                      <li key={listing.id}>
                        <ListingCard listing={listing} duration={slot.duration} slotParams={slotParams} />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Pagination
                      page={data.pagination.page}
                      totalPages={data.pagination.totalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                </>
              )}
            </div>

            {listings.some((l) => l.isDemo) && (
              <p className="mt-8 text-center text-xs text-slate-500">
                Listings marked “Demo” are sample spaces for demonstration and can’t be used for real parking.
              </p>
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}
