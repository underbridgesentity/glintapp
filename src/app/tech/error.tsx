"use client";

export default function TechError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="surface-1 rounded-card p-6">
      <h2 className="font-semibold text-white">Something went wrong.</h2>
      <p className="mt-1 text-sm text-mist">
        {error.message || "Try again. If it keeps failing, tell your site lead."}
      </p>
      <button
        onClick={reset}
        className="mt-4 btn-secondary px-6 py-2 text-sm "
      >
        Try again
      </button>
    </div>
  );
}
