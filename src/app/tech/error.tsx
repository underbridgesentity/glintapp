"use client";

export default function TechError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-card border border-carbon-border bg-carbon-mid p-6">
      <h2 className="font-semibold text-white">Something went wrong.</h2>
      <p className="mt-1 text-sm text-mist">
        {error.message || "Try again. If it keeps failing, tell your site lead."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-pill border border-carbon-border px-6 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
