import { Icon, type IconName } from "@/components/icons";

// Compact metric tile for dashboards. Lemon is reserved for the label/icon
// accent, never a fill — value stays white.
export function StatTile({
  label,
  value,
  icon,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: IconName;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className={accent ? "text-lemon" : "text-mist"}>
            <Icon name={icon} size={16} />
          </span>
        ) : null}
        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${accent ? "text-lemon" : "text-mist"}`}>
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-steel">{sub}</p> : null}
    </div>
  );
}
