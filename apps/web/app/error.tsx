'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-aether-primary">Oops!</h1>
        <h2 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="max-w-md text-muted-foreground">
          {error.message ||
            'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-aether-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:bg-aether-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
