export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold text-aether-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="max-w-md text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-block rounded-lg bg-aether-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:bg-aether-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
