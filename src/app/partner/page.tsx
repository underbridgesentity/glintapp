import { and, count, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { bookings, profiles, sites, subscriptions } from "@/db/schema";
import { requireRole } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Aggregates only — no customer names, emails, or plates on this surface.
export default async function PartnerDashboard() {
  const session = await requireRole(["developer_partner"]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);
  const daysElapsed = now.getDate();

  const partnerSites = await db
    .select({ id: sites.id, name: sites.name, dailyTarget: sites.dailyTarget })
    .from(sites)
    .where(
      and(
        eq(sites.developerPartnerId, session.user.id),
        isNull(sites.deletedAt),
      ),
    )
    .orderBy(sites.name);

  const rows = await Promise.all(
    partnerSites.map(async (site) => {
      const [[washes], [subs]] = await Promise.all([
        db
          .select({ n: count() })
          .from(bookings)
          .where(
            and(
              eq(bookings.siteId, site.id),
              eq(bookings.status, "complete"),
              gte(bookings.scheduledDate, monthStart),
              lt(bookings.scheduledDate, nextMonth),
              isNull(bookings.deletedAt),
            ),
          ),
        db
          .select({ n: count() })
          .from(subscriptions)
          .innerJoin(profiles, eq(profiles.userId, subscriptions.userId))
          .where(
            and(
              eq(profiles.homeSiteId, site.id),
              eq(subscriptions.status, "active"),
              isNull(subscriptions.deletedAt),
            ),
          ),
      ]);
      const capacity = site.dailyTarget * daysElapsed;
      return {
        ...site,
        washes: washes.n,
        subscribers: subs.n,
        utilisationPct:
          capacity > 0 ? Math.round((washes.n / capacity) * 100) : 0,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-2xl font-bold tracking-[-0.025em]">
        Amenity performance
      </h1>
      <p className="text-sm text-mist">
        {now.toLocaleString("en-ZA", { month: "long", year: "numeric" })},
        month to date. Counts are aggregates; no resident data is shown.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-mist">
          No sites are linked to your account yet. Contact Glint ops.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4"
            >
              <p className="font-semibold text-white">{s.name}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-semibold text-white">{s.washes}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Washes
                  </p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">
                    {s.subscribers}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Subscribers
                  </p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">
                    {s.utilisationPct}%
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Utilisation
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-steel">
                Utilisation = completed washes / ({s.dailyTarget} per day ×{" "}
                {daysElapsed} days).
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
