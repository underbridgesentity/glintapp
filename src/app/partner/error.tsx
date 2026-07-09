"use client";

export default function PartnerError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-card border border-carbon-border bg-carbon-mid p-6 text-center">
      <p className="font-semibold text-white">Something broke on our side.</p>
      <p className="mt-1 text-sm text-mist">Your data is intact. Retry.</p>
      <button
        onClick={reset}
        className="mt-4 rounded-pill border border-carbon-border px-6 py-2 text-sm text-white"
      >
        Retry
      </button>
    </div>
  );
}
