import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, escalations, profiles, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { assignedSiteFor } from "../data";
import { todayInJohannesburg } from "../checklist";

export default async function ReportPage() {
  const session = await requireRole(["site_lead"]);
  const site = await assignedSiteFor(session.user.id);
  if (!site) {
    return (
      <p className="text-mist">
        No site assigned to your profile. Ask ops to assign you.
      </p>
    );
  }

  const today = todayInJohannesburg();
  const todays = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      technicianId: bookings.technicianId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.siteId, site.id),
        eq(bookings.scheduledDate, today),
        isNull(bookings.deletedAt)
      )
    );
  const completes = todays.filter((b) => b.status === "complete");

  const roster = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(and(eq(profiles.assignedSiteId, site.id), isNull(users.deletedAt)));

  const perTech = roster
    .filter((t) => t.role === "technician")
    .map((t) => ({
      ...t,
      completes: completes.filter((b) => b.technicianId === t.id).length,
    }));

  const openEscalations = await db
    .select({
      id: escalations.id,
      reason: escalations.reason,
      status: escalations.status,
    })
    .from(escalations)
    .innerJoin(bookings, eq(escalations.bookingId, bookings.id))
    .where(eq(bookings.siteId, site.id));
  const unresolved = openEscalations.filter((e) => e.status !== "resolved");

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-card border border-carbon-border bg-carbon-mid p-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
          Today
        </h2>
        <p className="mt-2 text-3xl font-bold text-white">
          {completes.length} of {site.dailyTarget}
        </p>
        <p className="text-sm text-mist">
          Washes complete against the daily target. {todays.length} booked
          today.
        </p>
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
          Per technician
        </h2>
        {perTech.length === 0 ? (
          <p className="mt-2 text-sm text-mist">
            No technicians assigned to this site.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {perTech.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-card border border-carbon-border bg-carbon-mid p-3"
              >
                <span className="text-sm text-white">{t.name}</span>
                <span className="text-sm text-mist">
                  {t.completes} complete
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
          Escalations
        </h2>
        {unresolved.length === 0 ? (
          <p className="mt-2 text-sm text-mist">No open escalations.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {unresolved.map((e) => (
              <li
                key={e.id}
                className="rounded-card border border-carbon-border bg-carbon-mid p-3"
              >
                <span className="rounded-pill bg-carbon-raise px-3 py-1 text-xs text-mist">
                  {e.status.replace(/_/g, " ")}
                </span>
                <p className="mt-2 text-sm text-white">{e.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
          Roster
        </h2>
        {roster.length === 0 ? (
          <p className="mt-2 text-sm text-mist">No staff assigned yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {roster.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-card border border-carbon-border bg-carbon-mid p-3"
              >
                <span className="text-sm text-white">{t.name}</span>
                <span className="text-xs text-steel">
                  {t.role.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
