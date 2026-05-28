export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-aether-primary" />
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
