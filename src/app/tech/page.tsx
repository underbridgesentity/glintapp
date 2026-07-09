import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, vehicles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { assignedSiteFor } from "./data";
import { claimBookingAction } from "./actions";
import { todayInJohannesburg } from "./checklist";

type QueueRow = {
  id: string;
  status: "queued" | "in_progress" | "complete" | "re_wash" | "cancelled";
  washType: string;
  scheduledWindow: string;
  make: string;
  model: string;
  colour: string;
  plate: string;
};

const GROUPS: { status: QueueRow["status"]; label: string }[] = [
  { status: "queued", label: "Queued" },
  { status: "in_progress", label: "In progress" },
  { status: "complete", label: "Complete" },
];

export default async function QueuePage() {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  if (!site) {
    return (
      <p className="text-mist">
        No site assigned to your profile. Ask ops to assign you.
      </p>
    );
  }

  const rows: QueueRow[] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      washType: bookings.washType,
      scheduledWindow: bookings.scheduledWindow,
      make: vehicles.make,
      model: vehicles.model,
      colour: vehicles.colour,
      plate: vehicles.plate,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(
      and(
        eq(bookings.siteId, site.id),
        eq(bookings.scheduledDate, todayInJohannesburg()),
        isNull(bookings.deletedAt)
      )
    )
    .orderBy(asc(bookings.scheduledWindow));

  const openHour = site.operatingHours.split("-")[0] ?? "09:00";

  if (rows.length === 0) {
    return (
      <p className="text-mist">
        No cars in the queue. Check back at {openHour}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {GROUPS.map(({ status, label }) => {
        const group = rows.filter((r) => r.status === status);
        return (
          <section key={status}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
              {label} ({group.length})
            </h2>
            {group.length === 0 ? (
              <p className="mt-2 text-sm text-steel">Nothing here.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {group.map((b) => (
                  <li
                    key={b.id}
                    className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {b.make} {b.model}
                        </p>
                        <p className="text-sm text-mist">
                          {b.colour} · {b.plate}
                        </p>
                        <p className="mt-1 text-sm text-mist">
                          {b.washType === "interior_exterior"
                            ? "Interior + exterior"
                            : "Exterior"}{" "}
                          · {b.scheduledWindow}
                        </p>
                      </div>
                      {status === "queued" ? (
                        <form action={claimBookingAction}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <button
                            type="submit"
                            className="btn-press rounded-pill bg-lemon px-5 py-2 text-sm font-semibold text-carbon"
                          >
                            Claim
                          </button>
                        </form>
                      ) : status === "in_progress" ? (
                        <Link
                          href={`/tech/wash/${b.id}`}
                          className="btn-press rounded-pill border border-carbon-border px-5 py-2 text-sm font-medium text-white"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="rounded-pill bg-carbon-raise px-4 py-1 text-xs text-mist">
                          Done
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
