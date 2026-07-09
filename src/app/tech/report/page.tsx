import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, escalations, profiles, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { Icon } from "@/components/icons";
import { StatTile } from "@/components/ui/stat-tile";
import { Meter } from "@/components/ui/charts";
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
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-center gap-2">
          <Icon name="gauge" size={14} className="text-steel" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Today
          </h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Complete"
            value={String(completes.length)}
            icon="droplet"
            sub={`of ${site.dailyTarget} target`}
            accent
          />
          <StatTile
            label="Booked"
            value={String(todays.length)}
            icon="calendar"
            sub="today"
          />
          <StatTile
            label="Escalations"
            value={String(unresolved.length)}
            icon="alert"
            sub="open"
          />
        </div>
        <div className="mt-4 rounded-card border border-carbon-border bg-carbon-mid p-4">
          <Meter
            value={completes.length}
            max={site.dailyTarget}
            label="Daily target"
            right={`${completes.length}/${site.dailyTarget}`}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Icon name="users" size={14} className="text-steel" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Per technician
          </h2>
        </div>
        {perTech.length === 0 ? (
          <p className="mt-2 text-sm text-mist">
            No technicians assigned to this site.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4 rounded-card border border-carbon-border bg-carbon-mid p-4">
            {perTech.map((t) => (
              <Meter
                key={t.id}
                value={t.completes}
                max={site.dailyTarget}
                label={t.name}
                right={`${t.completes} done`}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Icon name="alert" size={14} className="text-steel" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Escalations
          </h2>
        </div>
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
        <div className="flex items-center gap-2">
          <Icon name="users" size={14} className="text-steel" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
            Roster
          </h2>
        </div>
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
