export default function Loading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-24 animate-pulse rounded-card bg-carbon-mid" />
      <div className="h-24 animate-pulse rounded-card bg-carbon-mid" />
      <div className="h-24 animate-pulse rounded-card bg-carbon-mid" />
    </div>
  );
}
