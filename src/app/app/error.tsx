"use client";

export default function CustomerError({ reset }: { reset: () => void }) {
  return (
    <div className="py-16">
      <h2 className="text-xl font-semibold text-white">Something broke.</h2>
      <p className="mt-2 text-sm text-mist">
        Not your car. Just this screen. Try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 btn-secondary px-6 py-2.5 text-sm "
      >
        Retry
      </button>
    </div>
  );
}
