// Lightweight, dependency-free SVG charts. Brand palette only: carbon
// surfaces, white/mist/steel text, lemon as the single accent series. No
// gradients beyond the permitted lemon-dim overlay. Server-renderable.

type Pt = { label: string; value: number };

const LEMON = "#CDFF00";
const MIST = "#8C8C8C";
const STEEL = "#5A5A5A";
const BORDER = "#2A2A2A";
const RAISE = "#1C1C1C"; // carbon-raise, for non-accent bars
const LEMON_DIM = "rgba(205,255,0,0.12)"; // the only permitted lemon overlay

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / pow) * pow;
}

export function BarChart({
  data,
  height = 160,
  accentIndex,
  format = (n) => String(n),
}: {
  data: Pt[];
  height?: number;
  accentIndex?: number;
  format?: (n: number) => string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const gap = 10;
  const barW = 100 / data.length;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" x2="100" y1={height - f * (height - 24)} y2={height - f * (height - 24)} stroke={BORDER} strokeWidth="0.3" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 24);
          const isAccent = accentIndex === undefined ? i === data.length - 1 : i === accentIndex;
          return (
            <rect
              key={i}
              x={i * barW + gap / data.length}
              y={height - h}
              width={barW - gap / data.length}
              height={Math.max(h, 0.5)}
              rx="1"
              fill={isAccent ? LEMON : RAISE}
              stroke={isAccent ? LEMON : BORDER}
              strokeWidth="0.3"
            />
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-steel">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  height = 160,
  format = (n) => String(n),
}: {
  data: Pt[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const w = 100;
  const pad = 4;
  const xs = data.map((_, i) => (data.length === 1 ? w / 2 : pad + (i / (data.length - 1)) * (w - pad * 2)));
  const ys = data.map((d) => height - 20 - (d.value / max) * (height - 32));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${height - 20} L${xs[0]},${height - 20} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0.33, 0.66, 1].map((f) => (
          <line key={f} x1="0" x2="100" y1={height - 20 - f * (height - 32)} y2={height - 20 - f * (height - 32)} stroke={BORDER} strokeWidth="0.3" />
        ))}
        <path d={area} fill={LEMON_DIM} />
        <path d={line} fill="none" stroke={LEMON} strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="0.9" fill={LEMON} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-steel">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Concentric progress ring (e.g. checklist 11/15, utilisation %).
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke={BORDER} strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={LEMON}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-white">{label ?? `${Math.round(pct * 100)}%`}</span>
        {sublabel ? <span className="text-[10px] text-mist">{sublabel}</span> : null}
      </div>
    </div>
  );
}

// Horizontal meter, e.g. site washes vs daily target.
export function Meter({ value, max, label, right }: { value: number; max: number; label: string; right?: string }) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const hit = pct >= 1;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white">{label}</span>
        <span className="text-mist">{right ?? `${value}/${max}`}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-carbon-raise">
        <div
          className="h-full rounded-pill"
          style={{ width: `${pct * 100}%`, background: hit ? LEMON : MIST }}
        />
      </div>
    </div>
  );
}

// Ratings distribution as stacked horizontal bars 5..1.
export function RatingBars({ counts }: { counts: Record<1 | 2 | 3 | 4 | 5, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = counts[star as 1 | 2 | 3 | 4 | 5] ?? 0;
        const pct = (n / total) * 100;
        const low = star < 3;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-3 text-mist">{star}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-pill bg-carbon-raise">
              <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: low ? STEEL : LEMON }} />
            </div>
            <span className="w-6 text-right text-xs text-mist">{n}</span>
          </div>
        );
      })}
    </div>
  );
}
