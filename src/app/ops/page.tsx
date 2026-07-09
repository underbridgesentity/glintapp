import { and, count, eq, gte, isNull, lt, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { bookings, escalations, payments, ratings, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { StatTile } from "@/components/ui/stat-tile";
import { BarChart, LineChart, Meter, ProgressRing, RatingBars } from "@/components/ui/charts";

export const dynamic = "force-dynamic";

function monthBounds(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

const SEGMENT_ORDER = [
  "subscription_recurring",
  "once_off",
  "fleet_invoice",
  "developer_reconciliation",
] as const;

const SEGMENT_LABELS: Record<string, string> = {
  subscription_recurring: "Subscriptions",
  once_off: "Once-off",
  fleet_invoice: "Fleet",
  developer_reconciliation: "Developer",
};

const SEGMENT_SHORT: Record<string, string> = {
  subscription_recurring: "Subs",
  once_off: "Once-off",
  fleet_invoice: "Fleet",
  developer_reconciliation: "Dev",
};

const STATUS_ORDER = [
  "queued",
  "in_progress",
  "complete",
  "re_wash",
  "cancelled",
] as const;

const STATUS_SHORT: Record<string, string> = {
  queued: "Queued",
  in_progress: "Active",
  complete: "Done",
  re_wash: "Re-wash",
  cancelled: "Cancel",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">
      {children}
    </p>
  );
}

export default async function OpsDashboard() {
  await requireRole(["ops_admin"]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const { start, end } = monthBounds(now);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const monthsWindow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-ZA", { month: "short" }),
    };
  });

  const [
    siteRows,
    todayRows,
    segmentRows,
    escStatusRows,
    trendRows,
    ratingRows,
    [yesterdayRow],
  ] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name, dailyTarget: sites.dailyTarget })
      .from(sites)
      .where(isNull(sites.deletedAt))
      .orderBy(sites.name),
    db
      .select({ siteId: bookings.siteId, status: bookings.status, n: count() })
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
      .select({ status: escalations.status, n: count() })
      .from(escalations)
      .groupBy(escalations.status),
    db
      .select({
        month: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
        total: sum(payments.amountCents),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "complete"),
          gte(payments.createdAt, sixMonthsStart),
        ),
      )
      .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`),
    db
      .select({ score: ratings.score, n: count() })
      .from(ratings)
      .where(gte(ratings.createdAt, thirtyDaysAgo))
      .groupBy(ratings.score),
    db
      .select({ n: count() })
      .from(bookings)
      .where(
        and(eq(bookings.scheduledDate, yesterday), isNull(bookings.deletedAt)),
      ),
  ]);

  const fmtR = (cents: number) =>
    `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

  // --- Today by site + status ---
  const bySite = new Map<string, Map<string, number>>();
  const statusTotals = new Map<string, number>();
  for (const r of todayRows) {
    const m = bySite.get(r.siteId) ?? new Map<string, number>();
    m.set(r.status, r.n);
    bySite.set(r.siteId, m);
    statusTotals.set(r.status, (statusTotals.get(r.status) ?? 0) + r.n);
  }
  const statusData = STATUS_ORDER.map((s) => ({
    label: STATUS_SHORT[s],
    value: statusTotals.get(s) ?? 0,
  }));
  const todayTotal = statusData.reduce((a, d) => a + d.value, 0);
  const yesterdayTotal = yesterdayRow?.n ?? 0;
  const washDelta = todayTotal - yesterdayTotal;

  // --- Revenue this month by segment ---
  const segMap = new Map(
    segmentRows.map((r) => [r.type, Number(r.total ?? 0)]),
  );
  const revenueTotal = SEGMENT_ORDER.reduce(
    (a, t) => a + (segMap.get(t) ?? 0),
    0,
  );
  const segData = SEGMENT_ORDER.map((t) => ({
    label: SEGMENT_SHORT[t],
    value: (segMap.get(t) ?? 0) / 100,
  }));
  const segMaxIdx = segData.reduce(
    (mi, d, i, arr) => (d.value > arr[mi].value ? i : mi),
    0,
  );

  // --- Revenue trend, 6 months ---
  const trendMap = new Map(
    trendRows.map((r) => [r.month, Number(r.total ?? 0)]),
  );
  const trendData = monthsWindow.map((m) => ({
    label: m.label,
    value: (trendMap.get(m.key) ?? 0) / 100,
  }));
  const lastMonthTotal = trendMap.get(monthsWindow[4].key) ?? 0;
  const revDeltaPct =
    lastMonthTotal > 0
      ? Math.round(((revenueTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : null;
  const revSub =
    revDeltaPct === null
      ? "first tracked month"
      : `${revDeltaPct >= 0 ? "+" : ""}${revDeltaPct}% vs last month`;

  // --- Escalations ---
  const escMap = new Map(escStatusRows.map((r) => [r.status, r.n]));
  const openEsc =
    (escMap.get("open") ?? 0) +
    (escMap.get("investigating") ?? 0) +
    (escMap.get("re_wash_scheduled") ?? 0);
  const newOpen = escMap.get("open") ?? 0;

  // --- Ratings, 30 days ---
  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let ratingSum = 0;
  let ratingN = 0;
  for (const r of ratingRows) {
    const s = r.score;
    if (s >= 1 && s <= 5) {
      ratingCounts[s as 1 | 2 | 3 | 4 | 5] = r.n;
      ratingSum += s * r.n;
      ratingN += r.n;
    }
  }
  const avgRating = ratingN > 0 ? ratingSum / ratingN : null;

  return (
    <div className="flex flex-col gap-10 pt-2">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-mist">
          Today, {now.toLocaleDateString("en-ZA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue this month"
          value={fmtR(revenueTotal)}
          icon="wallet"
          sub={revSub}
          accent
        />
        <StatTile
          label="Washes today"
          value={String(todayTotal)}
          icon="droplet"
          sub={`${washDelta >= 0 ? "+" : ""}${washDelta} vs yesterday`}
        />
        <StatTile
          label="Open escalations"
          value={String(openEsc)}
          icon="alert"
          sub={newOpen > 0 ? `${newOpen} new` : "queue clear"}
        />
        <StatTile
          label="Avg rating"
          value={avgRating ? avgRating.toFixed(1) : "—"}
          icon="star"
          sub={`${ratingN} ratings, 30d`}
        />
      </section>

      {/* Revenue */}
      <section className="flex flex-col gap-4">
        <SectionLabel>Revenue</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="glass rounded-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-white">
                Monthly revenue
              </h2>
              <span className="text-xs text-steel">Last 6 months</span>
            </div>
            <p className="mt-1 text-3xl font-semibold text-white">
              {fmtR(revenueTotal)}
            </p>
            <p className="text-xs text-mist">{revSub}</p>
            <div className="mt-4">
              <LineChart data={trendData} height={150} />
            </div>
          </div>

          <div className="rounded-card border border-carbon-border bg-carbon-mid p-5">
            <h2 className="text-base font-semibold text-white">By segment</h2>
            <span className="text-xs text-steel">This month</span>
            {revenueTotal === 0 ? (
              <p className="mt-4 text-sm text-mist">
                No completed payments this month.
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <BarChart
                    data={segData}
                    height={120}
                    accentIndex={segMaxIdx}
                  />
                </div>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {SEGMENT_ORDER.map((t) => {
                    const cents = segMap.get(t) ?? 0;
                    const pct = revenueTotal
                      ? Math.round((cents / revenueTotal) * 100)
                      : 0;
                    return (
                      <li
                        key={t}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-mist">{SEGMENT_LABELS[t]}</span>
                        <span className="flex items-baseline gap-2">
                          <span className="font-semibold text-white">
                            {fmtR(cents)}
                          </span>
                          <span className="w-8 text-right text-xs text-steel">
                            {pct}%
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Operations */}
      <section className="flex flex-col gap-4">
        <SectionLabel>Operations</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-carbon-border bg-carbon-mid p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-white">
                Washes vs target
              </h2>
              <span className="text-xs text-steel">Today</span>
            </div>
            {siteRows.length === 0 ? (
              <p className="mt-4 text-sm text-mist">
                No sites yet. Provision the first one under Sites.
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                {siteRows.map((site) => {
                  const m = bySite.get(site.id);
                  const total = m
                    ? Array.from(m.values()).reduce((a, b) => a + b, 0)
                    : 0;
                  return (
                    <Meter
                      key={site.id}
                      value={total}
                      max={site.dailyTarget}
                      label={site.name}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-card border border-carbon-border bg-carbon-mid p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-white">
                Today by status
              </h2>
              <span className="text-xs text-steel">{todayTotal} booked</span>
            </div>
            {todayTotal === 0 ? (
              <p className="mt-4 text-sm text-mist">
                No bookings scheduled today.
              </p>
            ) : (
              <div className="mt-4">
                <BarChart
                  data={statusData}
                  height={150}
                  accentIndex={STATUS_ORDER.indexOf("complete")}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="flex flex-col gap-4">
        <SectionLabel>Quality</SectionLabel>
        <div className="rounded-card border border-carbon-border bg-carbon-mid p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-white">
              Ratings distribution
            </h2>
            <span className="text-xs text-steel">Last 30 days</span>
          </div>
          {ratingN === 0 ? (
            <p className="mt-4 text-sm text-mist">No ratings in the last 30 days.</p>
          ) : (
            <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center">
                <ProgressRing
                  value={avgRating ?? 0}
                  max={5}
                  size={112}
                  label={avgRating ? avgRating.toFixed(1) : "—"}
                  sublabel="avg score"
                />
                <p className="mt-2 text-xs text-steel">{ratingN} ratings</p>
              </div>
              <RatingBars counts={ratingCounts} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
