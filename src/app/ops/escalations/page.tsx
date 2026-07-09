import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, escalations, sites, users, vehicles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { assignEscalationToSelf, updateEscalationStatus } from "../actions";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Record<
  string,
  { value: "investigating" | "re_wash_scheduled" | "resolved"; label: string }[]
> = {
  open: [{ value: "investigating", label: "Start investigating" }],
  investigating: [
    { value: "re_wash_scheduled", label: "Schedule re-wash" },
    { value: "resolved", label: "Resolve" },
  ],
  re_wash_scheduled: [{ value: "resolved", label: "Resolve" }],
  resolved: [],
};

export default async function EscalationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["ops_admin"]);
  const { error } = await searchParams;

  const rows = await db
    .select({
      id: escalations.id,
      reason: escalations.reason,
      status: escalations.status,
      resolution: escalations.resolution,
      assignedOpsId: escalations.assignedOpsId,
      createdAt: escalations.createdAt,
      bookingId: escalations.bookingId,
      scheduledDate: bookings.scheduledDate,
      washType: bookings.washType,
      siteName: sites.name,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehiclePlate: vehicles.plate,
      assigneeName: users.name,
    })
    .from(escalations)
    .innerJoin(bookings, eq(escalations.bookingId, bookings.id))
    .innerJoin(sites, eq(bookings.siteId, sites.id))
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .leftJoin(users, eq(escalations.assignedOpsId, users.id))
    .orderBy(desc(escalations.createdAt));

  const open = rows.filter((r) => r.status !== "resolved");
  const resolved = rows.filter((r) => r.status === "resolved");

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-2xl font-bold tracking-[-0.025em]">Escalations</h1>

      {error ? (
        <p className="surface-1 rounded-card px-4 py-3 text-sm text-white">
          {error === "transition"
            ? "That status change is not allowed from the current state."
            : "Something was off with that request. Try again."}
        </p>
      ) : null}

      {open.length === 0 ? (
        <p className="text-sm text-mist">
          0 open escalations. The queue is clear.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {open.map((r) => (
            <li
              key={r.id}
              className="surface-1 rounded-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-pill bg-carbon-raise px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  {r.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-steel">
                  {r.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
              <p className="mt-2 text-white">{r.reason}</p>
              <p className="mt-1 text-sm text-mist">
                {r.vehicleMake} {r.vehicleModel} · {r.vehiclePlate} ·{" "}
                {r.siteName} · wash {r.scheduledDate} (
                {r.washType.replace("_", " + ")})
              </p>
              <p className="mt-1 text-sm text-mist">
                Assigned: {r.assigneeName ?? "unassigned"}
              </p>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                {r.assignedOpsId !== session.user.id ? (
                  <form action={assignEscalationToSelf}>
                    <input type="hidden" name="escalationId" value={r.id} />
                    <button
                      type="submit"
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Assign to me
                    </button>
                  </form>
                ) : null}
                {NEXT_STATUS[r.status].map((next) => (
                  <form
                    key={next.value}
                    action={updateEscalationStatus}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="escalationId" value={r.id} />
                    <input type="hidden" name="status" value={next.value} />
                    {next.value === "resolved" ? (
                      <input
                        name="resolution"
                        required
                        placeholder="Resolution note"
                        className="rounded-card border border-carbon-border bg-carbon-raise px-3 py-2 text-sm text-white"
                      />
                    ) : null}
                    <button
                      type="submit"
                      className={
                        next.value === "resolved"
                          ? "btn-primary px-4 py-2 text-sm"
                          : "btn-secondary px-4 py-2 text-sm"
                      }
                    >
                      {next.label}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">
          Resolved ({resolved.length})
        </h2>
        {resolved.length === 0 ? (
          <p className="mt-2 text-sm text-mist">None resolved yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {resolved.map((r) => (
              <li
                key={r.id}
                className="rounded-card border border-carbon-border p-4 text-sm"
              >
                <p className="text-white">{r.reason}</p>
                <p className="mt-1 text-mist">
                  {r.siteName} · {r.vehiclePlate} · resolved:{" "}
                  {r.resolution ?? "no note"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
