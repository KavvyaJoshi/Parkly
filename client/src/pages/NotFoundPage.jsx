import Button from '../components/ui/Button.jsx';
import Container from '../components/ui/Container.jsx';

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        This page doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/search" variant="secondary">
          Find parking
        </Button>
      </div>
    </Container>
  );
}
