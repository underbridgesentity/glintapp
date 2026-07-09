import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, qualityChecks, vehicles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { assignedSiteFor } from "../../data";
import { markDoneAction, saveChecklistAction } from "../../actions";
import { CHECKLIST_POINTS } from "../../checklist";

export default async function WashPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  if (!site) {
    return (
      <p className="text-mist">
        No site assigned to your profile. Ask ops to assign you.
      </p>
    );
  }

  const { id } = await params;
  const [row] = await db
    .select({ booking: bookings, vehicle: vehicles })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(and(eq(bookings.id, id), eq(bookings.siteId, site.id)))
    .limit(1);
  if (!row) notFound();

  const { booking, vehicle } = row;
  const canComplete =
    booking.technicianId === session.user.id ||
    session.user.role === "site_lead";

  const [check] = await db
    .select()
    .from(qualityChecks)
    .where(eq(qualityChecks.bookingId, booking.id))
    .limit(1);
  const savedPoints = (check?.points ?? []) as {
    point: string;
    pass: boolean;
  }[];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link href="/tech" className="text-sm text-mist">
          Back to queue
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {vehicle.make} {vehicle.model}
        </h2>
        <p className="text-mist">
          {vehicle.colour} · {vehicle.plate} ·{" "}
          {booking.washType === "interior_exterior"
            ? "Interior + exterior"
            : "Exterior"}{" "}
          · {booking.scheduledWindow}
        </p>
        {vehicle.notes ? (
          <p className="mt-1 text-sm text-mist">Notes: {vehicle.notes}</p>
        ) : null}
        <span className="mt-2 inline-block rounded-pill bg-carbon-raise px-4 py-1 text-xs text-mist">
          {booking.status.replace("_", " ")}
        </span>
      </div>

      {booking.status === "complete" ? (
        <p className="text-mist">Wash complete. Nothing more to do here.</p>
      ) : (
        <>
          <form
            action={saveChecklistAction}
            className="rounded-card border border-carbon-border bg-carbon-mid p-4"
          >
            <input type="hidden" name="bookingId" value={booking.id} />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
              15-point checklist
            </h3>
            <ul className="mt-3 flex flex-col divide-y divide-carbon-border">
              {CHECKLIST_POINTS.map((point, i) => (
                <li key={point} className="py-2">
                  <label className="flex items-center justify-between gap-3 text-sm text-white">
                    <span>{point}</span>
                    <input
                      type="checkbox"
                      name={`point-${i}`}
                      defaultChecked={
                        savedPoints.find((p) => p.point === point)?.pass ??
                        false
                      }
                      className="h-5 w-5 accent-[var(--white)]"
                    />
                  </label>
                </li>
              ))}
            </ul>
            <label className="mt-4 block text-sm text-mist">
              Notes
              <textarea
                name="notes"
                rows={3}
                defaultValue={check?.notes ?? ""}
                className="mt-1 w-full rounded-card border border-carbon-border bg-carbon p-3 text-white"
              />
            </label>
            <button
              type="submit"
              className="mt-4 w-full rounded-pill border border-carbon-border px-6 py-3 font-semibold text-white"
            >
              {check ? "Update checklist" : "Save checklist"}
            </button>
            {check ? (
              <p className="mt-2 text-center text-xs text-steel">
                Checklist saved.
              </p>
            ) : null}
          </form>

          {canComplete ? (
            <form
              action={markDoneAction}
              className="rounded-card border border-carbon-border bg-carbon-mid p-4"
            >
              <input type="hidden" name="bookingId" value={booking.id} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
                Finish
              </h3>
              <label className="mt-3 block text-sm text-mist">
                Completion photo URLs, one per line
                <textarea
                  name="photoUrls"
                  rows={3}
                  placeholder="https://example.com/photo.jpg"
                  className="mt-1 w-full rounded-card border border-carbon-border bg-carbon p-3 text-white"
                />
              </label>
              <button
                type="submit"
                className="mt-4 w-full rounded-pill bg-lemon px-6 py-3 font-semibold text-carbon"
              >
                Mark done
              </button>
              <p className="mt-2 text-center text-xs text-steel">
                Requires a saved checklist. The owner gets notified.
              </p>
            </form>
          ) : (
            <p className="text-sm text-mist">
              Only the claiming technician or a site lead can complete this
              wash.
            </p>
          )}
        </>
      )}
    </div>
  );
}
