/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, vehicles, sites, users, washEvents, ratings } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { Icon } from "@/components/icons";
import { ProgressRing } from "@/components/ui/charts";
import { WashTimeline } from "@/components/ui/wash-timeline";
import { rateWashAction } from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  complete: "Complete",
  re_wash: "Re-wash scheduled",
  cancelled: "Cancelled",
};

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Stars({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={15}
          className={n <= score ? "text-white" : "text-steel"}
          fill={n <= score ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [row] = await db
    .select({ booking: bookings, vehicle: vehicles, site: sites, tech: users })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(sites, eq(bookings.siteId, sites.id))
    .leftJoin(users, eq(bookings.technicianId, users.id))
    .where(
      and(
        eq(bookings.id, id),
        eq(vehicles.ownerId, session.user.id),
        isNull(bookings.deletedAt)
      )
    )
    .limit(1);

  if (!row) notFound();

  const { booking, vehicle, site, tech } = row;

  const events = await db
    .select()
    .from(washEvents)
    .where(eq(washEvents.bookingId, booking.id))
    .orderBy(asc(washEvents.createdAt));

  const latestEvent = events[events.length - 1];
  const latestChecklist = [...events]
    .reverse()
    .find((e) => e.kind === "checklist_progress" && e.progress != null);
  const progress =
    latestChecklist?.progress ??
    (booking.status === "complete"
      ? 15
      : latestEvent
        ? KIND_PROGRESS[latestEvent.kind] ?? 0
        : 0);
  const currentStep = latestEvent
    ? STEP_LABEL[latestEvent.kind] ?? "In progress"
    : STEP_LABEL[booking.status] ?? "In the queue";

  const [rating] = await db
    .select()
    .from(ratings)
    .where(eq(ratings.bookingId, booking.id))
    .limit(1);

  const photos = (booking.completionPhotoUrls as string[]) ?? [];
  const techFirst = tech?.name ? tech.name.split(" ")[0] : null;
  const inProgress = booking.status === "in_progress";
  const isComplete = booking.status === "complete";

  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-xs font-medium text-mist"
      >
        <Icon name="chevronRight" size={14} className="rotate-180" /> Home
      </Link>

      {/* Header */}
      <header className="glass rounded-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-[-0.01em] text-white">
              {vehicle.colour} {vehicle.make} {vehicle.model}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-mist">
              <Icon name="mapPin" size={14} /> {site.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-steel">
              <Icon name="calendar" size={13} /> {booking.scheduledDate} ·{" "}
              {booking.scheduledWindow}
            </p>
          </div>
          {inProgress ? (
            <span className="rounded-pill bg-lemon-dim px-3 py-1 text-xs font-semibold text-lemon">
              {STATUS_LABEL[booking.status]}
            </span>
          ) : (
            <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs font-medium text-mist">
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          )}
        </div>
        {techFirst ? (
          <p className="mt-4 flex items-center gap-1.5 border-t border-carbon-border pt-3 text-xs text-mist">
            <Icon name="users" size={14} /> Technician: {techFirst}
          </p>
        ) : null}
      </header>

      {/* Progress */}
      <section className="flex items-center gap-5 rounded-card border border-carbon-border bg-carbon-mid p-5">
        <ProgressRing
          value={progress}
          max={15}
          size={104}
          label={`${progress}/15`}
          sublabel="checks"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Current step
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{currentStep}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-steel">
            <Icon name="leaf" size={13} /> Eco-friendly, water-efficient clean
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Timeline
        </h2>
        <WashTimeline events={events} />
      </section>

      {/* Completion photos */}
      {isComplete && photos.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-mist">
              <Icon name="camera" size={15} />
            </span>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Proof of clean
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((url) => (
              <img
                key={url}
                src={url}
                alt="Completed wash"
                className="aspect-square w-full rounded-card border border-carbon-border object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Rating */}
      {isComplete ? (
        rating ? (
          <section className="rounded-card border border-carbon-border bg-carbon-mid p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Your rating
            </h2>
            <div className="mt-3">
              <Stars score={rating.score} />
            </div>
            {rating.comment ? (
              <p className="mt-2 text-sm text-mist">&ldquo;{rating.comment}&rdquo;</p>
            ) : null}
          </section>
        ) : (
          <form
            action={rateWashAction}
            className="flex flex-col gap-3 rounded-card border border-carbon-border bg-carbon-mid p-5"
          >
            <input type="hidden" name="bookingId" value={booking.id} />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Rate this wash
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-pill border border-carbon-border text-sm text-white has-checked:bg-carbon-raise has-checked:font-bold"
                >
                  <input
                    type="radio"
                    name="score"
                    value={n}
                    required
                    className="sr-only"
                  />
                  {n}
                </label>
              ))}
            </div>
            <input
              name="comment"
              placeholder="Anything we should know? (optional)"
              className="rounded-card border border-carbon-border bg-carbon px-4 py-2.5 text-sm text-white placeholder:text-steel"
            />
            <button
              type="submit"
              className="self-start rounded-pill border border-carbon-border px-5 py-2 text-sm font-medium text-white"
            >
              Submit rating
            </button>
          </form>
        )
      ) : null}
    </div>
  );
}
