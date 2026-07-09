import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, bookings, notifications } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { markNotificationReadAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  complete: "Complete",
  re_wash: "Re-wash scheduled",
  cancelled: "Cancelled",
};

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
  const activeBookings =
    vehicleIds.length > 0
      ? await db
          .select()
          .from(bookings)
          .where(
            and(
              inArray(bookings.vehicleId, vehicleIds),
              inArray(bookings.status, ["queued", "in_progress"]),
              isNull(bookings.deletedAt)
            )
          )
          .orderBy(desc(bookings.createdAt))
      : [];

  const latestByVehicle = new Map<string, (typeof activeBookings)[number]>();
  for (const b of activeBookings) {
    if (!latestByVehicle.has(b.vehicleId)) latestByVehicle.set(b.vehicleId, b);
  }

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

  return (
    <div className="flex flex-col gap-8 py-4">
      <section>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          {isFleet ? "Your fleet" : "Your washes"}
        </h1>

        {isFleet ? (
          <div className="card-hover mt-4 rounded-card border border-carbon-border bg-carbon-mid p-5">
            <p className="text-3xl font-bold text-white">
              {myVehicles.length}
            </p>
            <p className="text-sm text-mist">
              vehicles on your fleet. {latestByVehicle.size} queued or in
              progress today.
            </p>
            <Link
              href="/app/fleet"
              className="btn-press mt-4 inline-block rounded-pill border border-carbon-border px-5 py-2 text-sm font-medium text-white"
            >
              Open fleet view
            </Link>
          </div>
        ) : myVehicles.length === 0 ? (
          <div className="mt-4 rounded-card border border-carbon-border bg-carbon-mid p-5">
            <p className="text-sm text-mist">
              No vehicles yet. Add 1 and book your first wash.
            </p>
            <Link
              href="/app/vehicles"
              className="btn-press mt-4 inline-block rounded-pill border border-carbon-border px-5 py-2 text-sm font-medium text-white"
            >
              Add a vehicle
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {myVehicles.map((v) => {
              const booking = latestByVehicle.get(v.id);
              return (
                <li
                  key={v.id}
                  className="card-hover flex items-center justify-between rounded-card border border-carbon-border bg-carbon-mid p-4"
                >
                  <span className="text-sm font-medium text-white">
                    {v.colour} {v.make} {v.model}
                  </span>
                  {booking ? (
                    booking.status === "in_progress" ? (
                      <span className="rounded-pill bg-lemon-dim px-3 py-1 text-xs font-semibold text-lemon">
                        In progress
                      </span>
                    ) : (
                      <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist">
                        {STATUS_LABEL[booking.status]}{" "}
                        {booking.scheduledWindow.split("-")[0]}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-steel">No wash booked</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href="/app/book"
        className="btn-press rounded-pill bg-lemon px-8 py-4 text-center font-semibold text-carbon"
      >
        Book next wash
      </Link>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
          Notifications
        </h2>
        {unread.length === 0 ? (
          <p className="mt-3 text-sm text-steel">
            Nothing unread. We only message you when it matters.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {unread.map((n) => (
              <li
                key={n.id}
                className="card-hover flex items-start justify-between gap-3 rounded-card border border-carbon-border bg-carbon-mid p-4"
              >
                <div>
                  <p className="text-sm text-white">
                    {n.template.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-steel">
                    {n.createdAt.toLocaleDateString("en-ZA")}
                  </p>
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
