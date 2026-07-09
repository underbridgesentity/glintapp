import { Icon, type IconName } from "@/components/icons";

export type WashEvent = {
  kind: string;
  note: string | null;
  progress: number | null;
  createdAt: Date;
};

const STEP_META: Record<string, { label: string; icon: IconName }> = {
  booked: { label: "Booked", icon: "calendar" },
  queued: { label: "In the queue", icon: "list" },
  claimed: { label: "Technician assigned", icon: "users" },
  arrived: { label: "Technician on site", icon: "mapPin" },
  in_progress: { label: "Wash in progress", icon: "droplet" },
  checklist_progress: { label: "Quality checks", icon: "checkCircle" },
  photos_uploaded: { label: "Proof photos added", icon: "camera" },
  complete: { label: "Clean and done", icon: "sparkle" },
  re_wash: { label: "Re-wash scheduled", icon: "alert" },
};

function time(d: Date) {
  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

// Vertical timeline. The most recent event is the current, lemon-accented step.
export function WashTimeline({ events }: { events: WashEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-steel">
        No activity yet. We update this the moment your wash starts.
      </p>
    );
  }
  const ordered = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const currentIdx = ordered.length - 1;

  return (
    <ol className="flex flex-col">
      {ordered.map((e, i) => {
        const meta = STEP_META[e.kind] ?? { label: e.kind, icon: "activity" as IconName };
        const isCurrent = i === currentIdx;
        const last = i === ordered.length - 1;
        return (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-pill border ${
                  isCurrent
                    ? "border-lemon bg-lemon-dim text-lemon"
                    : "border-carbon-border bg-carbon-raise text-mist"
                }`}
              >
                <Icon name={meta.icon} size={16} />
              </span>
              {!last ? <span className="my-1 w-px flex-1 bg-carbon-border" /> : null}
            </div>
            <div className={`pb-6 ${last ? "pb-0" : ""}`}>
              <p className={`text-sm font-medium ${isCurrent ? "text-white" : "text-mist"}`}>
                {meta.label}
                {e.progress != null ? (
                  <span className="text-mist"> · {e.progress}/15 checks</span>
                ) : null}
              </p>
              {e.note ? <p className="text-xs text-steel">{e.note}</p> : null}
              <p className="mt-0.5 text-[11px] text-steel">{time(e.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
