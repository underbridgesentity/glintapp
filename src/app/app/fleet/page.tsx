import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, bookings, payments } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { formatRands } from "../pricing";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  complete: "Complete",
  re_wash: "Re-wash",
  cancelled: "Cancelled",
};

export default async function FleetPage() {
  const session = await requireRole(["fleet_manager"]);

  const fleetVehicles = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.ownerId, session.user.id), isNull(vehicles.deletedAt))
    )
    .orderBy(vehicles.createdAt);

  const vehicleIds = fleetVehicles.map((v) => v.id);
  const allBookings =
    vehicleIds.length > 0
      ? await db
          .select()
          .from(bookings)
          .where(
            and(
              inArray(bookings.vehicleId, vehicleIds),
              isNull(bookings.deletedAt)
            )
          )
          .orderBy(desc(bookings.createdAt))
      : [];

  const latestByVehicle = new Map<string, (typeof allBookings)[number]>();
  for (const b of allBookings) {
    if (!latestByVehicle.has(b.vehicleId)) latestByVehicle.set(b.vehicleId, b);
  }

  const fleetPayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, session.user.id),
        eq(payments.type, "fleet_invoice")
      )
    );

  const invoicedCents = fleetPayments
    .filter((p) => p.status === "complete" || p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const outstandingCents = fleetPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="flex flex-col gap-8 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Fleet
        </h1>
        <p className="mt-2 text-sm text-mist">
          {fleetVehicles.length} vehicles. 1 invoice. 0 admin.
        </p>
      </div>

      <section className="surface-1 rounded-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-mist">
          Invoice summary
        </h2>
        <div className="mt-3 flex gap-8">
          <div>
            <p className="text-2xl font-bold text-white">
              {formatRands(invoicedCents)}
            </p>
            <p className="text-xs text-mist">invoiced to date</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {formatRands(outstandingCents)}
            </p>
            <p className="text-xs text-mist">outstanding</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-mist">
          Vehicles
        </h2>
        {fleetVehicles.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-mist">
              No vehicles on your fleet yet. Add them once. We handle the rest.
            </p>
            <Link
              href="/app/vehicles"
              className="mt-4 inline-block btn-primary px-6 py-2.5 text-sm"
            >
              Add vehicles
            </Link>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {fleetVehicles.map((v) => {
              const latest = latestByVehicle.get(v.id);
              return (
                <li
                  key={v.id}
                  className="surface-1 rounded-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {v.colour} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-mist">{v.plate}</p>
                    </div>
                    {latest ? (
                      <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist">
                        {STATUS_LABEL[latest.status]} —{" "}
                        {latest.scheduledDate}
                      </span>
                    ) : (
                      <span className="text-xs text-steel">No washes yet</span>
                    )}
                  </div>
                  <Link
                    href="/app/history"
                    className="mt-2 inline-block text-xs text-mist underline underline-offset-4"
                  >
                    View wash history
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
