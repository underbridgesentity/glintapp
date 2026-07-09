export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      Glint<span className="text-lemon">.</span>
    </span>
  );
}
