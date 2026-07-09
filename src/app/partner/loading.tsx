export default function Loading() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse surface-1 rounded-card"
        />
      ))}
    </div>
  );
}
