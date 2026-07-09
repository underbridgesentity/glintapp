import Link from "next/link";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
} from "drizzle-orm";
import { db } from "@/db";
import {
  vehicles,
  bookings,
  notifications,
  sites,
  ratings,
  subscriptions,
  washEvents,
} from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { Icon, type IconName } from "@/components/icons";
import { StatTile } from "@/components/ui/stat-tile";
import { ProgressRing } from "@/components/ui/charts";
import { markNotificationReadAction } from "./actions";

export const dynamic = "force-dynamic";

// Map a wash event kind to a human step label and an approximate checklist
// position, so a live status reads correctly even before checklist events land.
const STEP_LABEL: Record<string, string> = {
  booked: "Booked",
  queued: "In the queue",
  claimed: "Technician assigned",
  arrived: "Technician on site",
  in_progress: "Wash in progress",
  checklist_progress: "Quality checks",
  photos_uploaded: "Proof photos added",
  complete: "Clean and done",
  re_wash: "Re-wash scheduled",
};

const KIND_PROGRESS: Record<string, number> = {
  booked: 0,
  queued: 0,
  claimed: 1,
  arrived: 2,
  in_progress: 4,
  checklist_progress: 8,
  photos_uploaded: 14,
  complete: 15,
};

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function humanize(template: string): string {
  const s = template.replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function notifIcon(template: string): IconName {
  if (template.includes("escalation")) return "alert";
  if (template.includes("book")) return "calendar";
  if (
    template.includes("plan") ||
    template.includes("payment") ||
    template.includes("invoice") ||
    template.includes("billing")
  )
    return "creditCard";
  if (
    template.includes("complete") ||
    template.includes("done") ||
    template.includes("wash")
  )
    return "checkCircle";
  return "bell";
}

function nextWashDate(days: string[]): Date | null {
  if (!days || days.length === 0) return null;
  const wanted = new Set(
    days.map((d) => DAY_INDEX[d]).filter((n) => n !== undefined)
  );
  if (wanted.size === 0) return null;
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (wanted.has(d.getDay())) return d;
  }
  return null;
}

function friendlyDay(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((t.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return t.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover flex items-center gap-3 rounded-card border border-carbon-border bg-carbon-mid p-4"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-carbon-raise text-white">
        <Icon name={icon} size={18} />
      </span>
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      <span className="text-steel">
        <Icon name="chevronRight" size={16} />
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const session = await requireRole(CUSTOMER_ROLES);
  const isFleet = session.user.role === "fleet_manager";

  const myVehicles = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.ownerId, session.user.id), isNull(vehicles.deletedAt))
    )
    .orderBy(vehicles.createdAt);
  const vehicleIds = myVehicles.map((v) => v.id);

  const activeRows = vehicleIds.length
    ? await db
        .select({ booking: bookings, vehicle: vehicles, site: sites })
        .from(bookings)
        .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .innerJoin(sites, eq(bookings.siteId, sites.id))
        .where(
          and(
            inArray(bookings.vehicleId, vehicleIds),
            inArray(bookings.status, ["queued", "in_progress"]),
            isNull(bookings.deletedAt)
          )
        )
        .orderBy(asc(bookings.scheduledDate))
    : [];

  const hero =
    activeRows.find((r) => r.booking.status === "in_progress") ??
    activeRows[0] ??
    null;

  const heroEvents = hero
    ? await db
        .select()
        .from(washEvents)
        .where(eq(washEvents.bookingId, hero.booking.id))
        .orderBy(asc(washEvents.createdAt))
    : [];
  const latestEvent = heroEvents[heroEvents.length - 1];
  const latestChecklist = [...heroEvents]
    .reverse()
    .find((e) => e.kind === "checklist_progress" && e.progress != null);
  const heroProgress =
    latestChecklist?.progress ??
    (latestEvent ? KIND_PROGRESS[latestEvent.kind] ?? 0 : 0);
  const heroStep = latestEvent
    ? STEP_LABEL[latestEvent.kind] ?? "In progress"
    : hero?.booking.status === "in_progress"
      ? "Wash in progress"
      : "In the queue";

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const [monthAgg] = vehicleIds.length
    ? await db
        .select({ n: count() })
        .from(bookings)
        .where(
          and(
            inArray(bookings.vehicleId, vehicleIds),
            eq(bookings.status, "complete"),
            gte(bookings.scheduledDate, monthStart),
            isNull(bookings.deletedAt)
          )
        )
    : [{ n: 0 }];
  const [totalAgg] = vehicleIds.length
    ? await db
        .select({ n: count() })
        .from(bookings)
        .where(
          and(
            inArray(bookings.vehicleId, vehicleIds),
            eq(bookings.status, "complete"),
            isNull(bookings.deletedAt)
          )
        )
    : [{ n: 0 }];
  const [ratingAgg] = await db
    .select({ a: avg(ratings.score) })
    .from(ratings)
    .where(eq(ratings.userId, session.user.id));

  const washesThisMonth = Number(monthAgg?.n ?? 0);
  const totalWashes = Number(totalAgg?.n ?? 0);
  const avgRating = ratingAgg?.a != null ? Number(ratingAgg.a) : null;

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);
  const scheduledDays = (subscription?.scheduledWashDays as string[]) ?? [];
  const nextDate = nextWashDate(scheduledDays);

  const unread = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, session.user.id),
        isNull(notifications.readAt)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(10);

  const activeCount = activeRows.length;

  return (
    <div className="flex flex-col gap-8 py-2">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          {isFleet ? "Your fleet" : "Your washes"}
        </h1>
        <p className="mt-1 text-sm text-mist">
          {isFleet
            ? "One dashboard. Every vehicle."
            : "Booked, cleaned, verified. Track it here."}
        </p>
      </header>

      {/* Live status hero */}
      {isFleet ? (
        <section className="glass rounded-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Fleet status
            </h2>
            {activeCount > 0 ? (
              <span className="rounded-pill bg-lemon-dim px-3 py-1 text-xs font-semibold text-lemon">
                {activeCount} active
              </span>
            ) : (
              <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist">
                All idle
              </span>
            )}
          </div>
          <div className="mt-4 flex items-end gap-10">
            <div>
              <p className="text-3xl font-bold text-white">
                {myVehicles.length}
              </p>
              <p className="text-xs text-mist">vehicles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-mist">queued or in progress</p>
            </div>
          </div>
          <Link
            href="/app/fleet"
            className="btn-press mt-5 inline-flex items-center gap-2 rounded-pill border border-carbon-border px-6 py-3 text-sm font-medium text-white"
          >
            Open fleet view <Icon name="arrowRight" size={16} />
          </Link>
        </section>
      ) : myVehicles.length === 0 ? (
        <section className="rounded-card border border-carbon-border bg-carbon-mid p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Get started
          </h2>
          <p className="mt-3 text-lg font-semibold text-white">
            No vehicles yet
          </p>
          <p className="mt-1 text-sm text-mist">
            Add 1 vehicle and book your first wash. 30 seconds.
          </p>
          <Link
            href="/app/vehicles"
            className="btn-press mt-4 inline-flex items-center gap-2 rounded-pill bg-lemon px-6 py-3 font-semibold text-carbon"
          >
            <Icon name="plus" size={16} /> Add a vehicle
          </Link>
        </section>
      ) : hero && hero.booking.status === "in_progress" ? (
        <section className="glass rounded-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Live status
            </h2>
            <span className="rounded-pill bg-lemon-dim px-3 py-1 text-xs font-semibold text-lemon">
              In progress
            </span>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing
              value={heroProgress}
              max={15}
              size={104}
              label={`${heroProgress}/15`}
              sublabel="checks"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">
                {hero.vehicle.colour} {hero.vehicle.make} {hero.vehicle.model}
              </p>
              <p className="text-sm text-mist">{heroStep}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-steel">
                <Icon name="mapPin" size={13} /> {hero.site.name}
              </p>
            </div>
          </div>
          <Link
            href={`/app/track/${hero.booking.id}`}
            className="btn-press mt-5 flex items-center justify-center gap-2 rounded-pill bg-lemon px-6 py-3 font-semibold text-carbon"
          >
            Track wash <Icon name="arrowRight" size={16} />
          </Link>
        </section>
      ) : hero ? (
        <section className="glass rounded-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Live status
            </h2>
            <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs font-medium text-mist">
              Queued
            </span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-carbon-raise text-mist">
              <Icon name="clock" size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">
                {hero.vehicle.colour} {hero.vehicle.make} {hero.vehicle.model}
              </p>
              <p className="text-sm text-mist">
                Arriving {hero.booking.scheduledWindow}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-steel">
                <Icon name="mapPin" size={13} /> {hero.site.name} ·{" "}
                {hero.booking.scheduledDate}
              </p>
            </div>
          </div>
          <Link
            href={`/app/track/${hero.booking.id}`}
            className="btn-press mt-5 flex items-center justify-center gap-2 rounded-pill bg-lemon px-6 py-3 font-semibold text-carbon"
          >
            Track wash <Icon name="arrowRight" size={16} />
          </Link>
        </section>
      ) : (
        <section className="rounded-card border border-carbon-border bg-carbon-mid p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Live status
          </h2>
          <p className="mt-3 text-lg font-semibold text-white">
            No wash in progress
          </p>
          <p className="mt-1 text-sm text-mist">
            {nextDate
              ? `Next scheduled wash ${friendlyDay(nextDate)}.`
              : "Book your next wash. We arrive, clean, and leave before you notice."}
          </p>
          <Link
            href="/app/book"
            className="btn-press mt-4 inline-flex items-center gap-2 rounded-pill bg-lemon px-6 py-3 font-semibold text-carbon"
          >
            <Icon name="plus" size={16} /> Book next wash
          </Link>
        </section>
      )}

      {/* Stats */}
      <section>
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            label="Washes"
            value={String(washesThisMonth)}
            icon="droplet"
            sub="this month"
          />
          <StatTile
            label="Rating"
            value={avgRating != null ? avgRating.toFixed(1) : "—"}
            icon="star"
            sub={avgRating != null ? "avg given" : "none yet"}
          />
          <StatTile
            label="Eco washes"
            value={String(totalWashes)}
            icon="leaf"
            sub="water-efficient"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction href="/app/book" icon="plus" label="Book wash" />
          <QuickAction
            href="/app/vehicles"
            icon="car"
            label={isFleet ? "Fleet vehicles" : "My vehicles"}
          />
          <QuickAction
            href="/app/schedule"
            icon="calendar"
            label="Schedule"
          />
          <QuickAction href="/app/support" icon="message" label="Support" />
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-mist">
            <Icon name="bell" size={15} />
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Notifications
          </h2>
        </div>
        {unread.length === 0 ? (
          <p className="text-sm text-steel">
            Nothing unread. We only message you when it matters.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {unread.map((n) => (
              <li
                key={n.id}
                className="card-hover flex items-start justify-between gap-3 rounded-card border border-carbon-border bg-carbon-mid p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-mist">
                    <Icon name={notifIcon(n.template)} size={16} />
                  </span>
                  <div>
                    <p className="text-sm text-white">{humanize(n.template)}</p>
                    <p className="text-xs text-steel">
                      {n.createdAt.toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                </div>
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <button
                    type="submit"
                    className="btn-press rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist"
                  >
                    Mark read
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
