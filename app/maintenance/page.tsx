export default function MaintenancePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        AMG Connect
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Portal maintenance in progress
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        AMG Connect is temporarily unavailable while AMG Operations completes a security update.
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        For urgent flight-support coordination, contact AMG Operations directly.
      </p>
    </main>
  );
}
