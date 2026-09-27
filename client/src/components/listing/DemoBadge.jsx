export default function DemoBadge({ className = '' }) {
  return (
    <span
      title="Sample listing for demonstration — not a real parking space"
      className={`inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset ${className}`}
    >
      Demo
    </span>
  );
}
