import { and, count, eq, gte, isNull, lt, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { bookings, escalations, payments, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";

export const dynamic = "force-dynamic";

function monthBounds(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

const SEGMENT_LABELS: Record<string, string> = {
  subscription_recurring: "Subscriptions",
  once_off: "Once-off",
  fleet_invoice: "Fleet",
  developer_reconciliation: "Developer",
};

const STATUS_ORDER = [
  "queued",
  "in_progress",
  "complete",
  "re_wash",
  "cancelled",
] as const;

export default async function OpsDashboard() {
  await requireRole(["ops_admin"]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const { start, end } = monthBounds(now);

  const [siteRows, todayRows, revenueRows, [openEsc]] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name, dailyTarget: sites.dailyTarget })
      .from(sites)
      .where(isNull(sites.deletedAt))
      .orderBy(sites.name),
    db
      .select({
        siteId: bookings.siteId,
        status: bookings.status,
        n: count(),
      })
      .from(bookings)
      .where(and(eq(bookings.scheduledDate, today), isNull(bookings.deletedAt)))
      .groupBy(bookings.siteId, bookings.status),
    db
      .select({ type: payments.type, total: sum(payments.amountCents) })
      .from(payments)
      .where(
        and(
          eq(payments.status, "complete"),
          gte(payments.createdAt, start),
          lt(payments.createdAt, end),
        ),
      )
      .groupBy(payments.type),
    db
      .select({ n: count() })
      .from(escalations)
      .where(sql`${escalations.status} != 'resolved'`),
  ]);

  const bySite = new Map<string, Map<string, number>>();
  for (const r of todayRows) {
    const m = bySite.get(r.siteId) ?? new Map();
    m.set(r.status, r.n);
    bySite.set(r.siteId, m);
  }

  const revenueTotal = revenueRows.reduce(
    (acc, r) => acc + Number(r.total ?? 0),
    0,
  );

  const fmtR = (cents: number) =>
    `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
            Revenue this month
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {fmtR(revenueTotal)}
          </p>
        </div>
        <div className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Open escalations
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {openEsc?.n ?? 0}
          </p>
        </div>
        <div className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Sites
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {siteRows.length}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">
          Today, {today}
        </h2>
        {siteRows.length === 0 ? (
          <p className="mt-3 text-sm text-mist">
            No sites yet. Provision the first one under Sites.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-card border border-carbon-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-carbon-border text-left text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  <th className="px-4 py-3">Site</th>
                  {STATUS_ORDER.map((s) => (
                    <th key={s} className="px-3 py-3">
                      {s.replace("_", " ")}
                    </th>
                  ))}
                  <th className="px-3 py-3">vs target</th>
                </tr>
              </thead>
              <tbody>
                {siteRows.map((site) => {
                  const m = bySite.get(site.id);
                  const totalToday = STATUS_ORDER.reduce(
                    (acc, s) => acc + (m?.get(s) ?? 0),
                    0,
                  );
                  return (
                    <tr
                      key={site.id}
                      className="border-b border-carbon-border last:border-0"
                    >
                      <td className="px-4 py-3 text-white">{site.name}</td>
                      {STATUS_ORDER.map((s) => (
                        <td key={s} className="px-3 py-3 text-mist">
                          {m?.get(s) ?? 0}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-white">
                        {totalToday}/{site.dailyTarget}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">
          Revenue by segment
        </h2>
        {revenueRows.length === 0 ? (
          <p className="mt-3 text-sm text-mist">
            No completed payments this month.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {revenueRows.map((r) => (
              <div
                key={r.type}
                className="card-hover rounded-card border border-carbon-border bg-carbon-mid p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  {SEGMENT_LABELS[r.type] ?? r.type}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {fmtR(Number(r.total ?? 0))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
