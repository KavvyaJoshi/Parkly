export default function SectionHeading({ eyebrow, title, description, id, align = 'center' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : '';

  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{eyebrow}</p>
      )}
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-lg text-slate-600">{description}</p>}
    </div>
  );
}
