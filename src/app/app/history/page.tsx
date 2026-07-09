/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, bookings, ratings, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { Icon } from "@/components/icons";
import { rateWashAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  complete: "Complete",
  re_wash: "Re-wash",
  cancelled: "Cancelled",
};

function Stars({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={14}
          className={n <= score ? "text-white" : "text-steel"}
          fill={n <= score ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export default async function HistoryPage() {
  const session = await requireRole(CUSTOMER_ROLES);

  const rows = await db
    .select({
      booking: bookings,
      vehicle: vehicles,
      site: sites,
      rating: ratings,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(sites, eq(bookings.siteId, sites.id))
    .leftJoin(ratings, eq(ratings.bookingId, bookings.id))
    .where(
      and(
        eq(vehicles.ownerId, session.user.id),
        inArray(bookings.status, ["complete", "re_wash", "cancelled"]),
        isNull(bookings.deletedAt)
      )
    )
    .orderBy(desc(bookings.scheduledDate))
    .limit(50);

  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
        History
      </h1>

      {rows.length === 0 ? (
        <p className="text-sm text-mist">
          No past washes yet. Your first clean car is 1 booking away.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map(({ booking, vehicle, site, rating }) => {
            const photos = (booking.completionPhotoUrls as string[]) ?? [];
            return (
              <li
                key={booking.id}
                className="rounded-card border border-carbon-border bg-carbon-mid p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 text-mist">
                      <Icon name="car" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {vehicle.colour} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-mist">
                        <Icon name="calendar" size={12} /> {booking.scheduledDate}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-mist">
                        <Icon name="mapPin" size={12} /> {site.name} ·{" "}
                        {booking.washType === "exterior"
                          ? "Exterior"
                          : "Interior and exterior"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist">
                    {STATUS_LABEL[booking.status]}
                  </span>
                </div>

                {photos.length > 0 ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {photos.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Completed wash"
                        className="h-20 w-20 shrink-0 rounded-card border border-carbon-border object-cover"
                      />
                    ))}
                  </div>
                ) : null}

                <Link
                  href={`/app/track/${booking.id}`}
                  className="btn-press mt-3 inline-flex items-center gap-1.5 rounded-pill border border-carbon-border px-4 py-1.5 text-xs font-medium text-white"
                >
                  <Icon name="activity" size={14} /> Track
                </Link>

                {rating ? (
                  <div className="mt-4 flex flex-col gap-1.5 border-t border-carbon-border pt-4">
                    <div className="flex items-center gap-2">
                      <Stars score={rating.score} />
                      <span className="text-xs text-mist">
                        {rating.score} of 5
                      </span>
                    </div>
                    {rating.comment ? (
                      <p className="text-xs text-steel">
                        &ldquo;{rating.comment}&rdquo;
                      </p>
                    ) : null}
                  </div>
                ) : booking.status === "complete" ? (
                  <form
                    action={rateWashAction}
                    className="mt-4 flex flex-col gap-3 border-t border-carbon-border pt-4"
                  >
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <p className="flex items-center gap-1.5 text-xs font-medium text-mist">
                      <Icon name="star" size={13} /> Rate this wash
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
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
