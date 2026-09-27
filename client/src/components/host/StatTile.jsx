/** A single headline number: sentence-case label, large value, optional context line. */
export default function StatTile({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </div>
  );
}
