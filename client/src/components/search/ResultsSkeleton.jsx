export default function ResultsSkeleton({ count = 3 }) {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 sm:flex-row">
          <div className="h-44 bg-slate-200 sm:h-40 sm:w-56" />
          <div className="flex-1 space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="flex gap-2 pt-4">
              <div className="h-6 w-20 rounded-full bg-slate-200" />
              <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
