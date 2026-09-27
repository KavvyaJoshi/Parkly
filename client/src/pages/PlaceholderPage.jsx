import { Construction } from 'lucide-react';

import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';

// Temporary page for routes whose features are built in later phases.
export default function PlaceholderPage({ title, description }) {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Construction className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">{description}</p>
      <Button to="/" variant="secondary" className="mt-8">
        Back to home
      </Button>
    </Container>
  );
}
