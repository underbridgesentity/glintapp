import { and, eq, gte, inArray, isNull, lt, sum } from "drizzle-orm";
import { db } from "@/db";
import { bookings, payments, profiles, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Attribution, kept deliberately simple:
// 1. Booking-linked payments (once-off, fleet) count toward the site of
//    the booking they paid for.
// 2. Subscription payments count toward the subscriber's home site
//    (profiles.homeSiteId) — the site their plan is anchored to.
// Only payments with status "complete" in the selected month are counted.
// The partner share line applies profiles.revenueSharePct to the gross.

function fmtR(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireRole(["developer_partner"]);
  const params = await searchParams;

  const now = new Date();
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "")
    ? (params.month as string)
    : fallback;
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const [profile] = await db
    .select({ revenueSharePct: profiles.revenueSharePct })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);
  const sharePct = Number(profile?.revenueSharePct ?? 5);

  const partnerSites = await db
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .where(
      and(
        eq(sites.developerPartnerId, session.user.id),
        isNull(sites.deletedAt),
      ),
    )
    .orderBy(sites.name);

  const siteIds = partnerSites.map((s) => s.id);

  let bookingRevenue: { siteId: string; total: string | null }[] = [];
  let subscriptionRevenue: { siteId: string | null; total: string | null }[] =
    [];

  if (siteIds.length > 0) {
    [bookingRevenue, subscriptionRevenue] = await Promise.all([
      db
        .select({ siteId: bookings.siteId, total: sum(payments.amountCents) })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(
          and(
            eq(payments.status, "complete"),
            gte(payments.createdAt, start),
            lt(payments.createdAt, end),
            inArray(bookings.siteId, siteIds),
          ),
        )
        .groupBy(bookings.siteId),
      db
        .select({
          siteId: profiles.homeSiteId,
          total: sum(payments.amountCents),
        })
        .from(payments)
        .innerJoin(profiles, eq(profiles.userId, payments.userId))
        .where(
          and(
            eq(payments.status, "complete"),
            eq(payments.type, "subscription_recurring"),
            gte(payments.createdAt, start),
            lt(payments.createdAt, end),
            inArray(profiles.homeSiteId, siteIds),
          ),
        )
        .groupBy(profiles.homeSiteId),
    ]);
  }

  const bookingBySite = new Map(
    bookingRevenue.map((r) => [r.siteId, Number(r.total ?? 0)]),
  );
  const subsBySite = new Map(
    subscriptionRevenue.map((r) => [r.siteId, Number(r.total ?? 0)]),
  );

  const statementRows = partnerSites.map((s) => {
    const bookingCents = bookingBySite.get(s.id) ?? 0;
    const subsCents = subsBySite.get(s.id) ?? 0;
    const gross = bookingCents + subsCents;
    return { ...s, bookingCents, subsCents, gross };
  });
  const grossTotal = statementRows.reduce((acc, r) => acc + r.gross, 0);
  const shareCents = Math.round((grossTotal * sharePct) / 100);

  const prev = new Date(Date.UTC(y, m - 2, 1));
  const next = new Date(Date.UTC(y, m, 1));
  const toMonth = (d: Date) => d.toISOString().slice(0, 7);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">
          Statement, {month}
        </h1>
        <div className="flex gap-2 text-sm">
          <a
            href={`/partner/statement?month=${toMonth(prev)}`}
            className="rounded-pill border border-carbon-border px-4 py-1.5 text-mist"
          >
            ← {toMonth(prev)}
          </a>
          {next <= now ? (
            <a
              href={`/partner/statement?month=${toMonth(next)}`}
              className="rounded-pill border border-carbon-border px-4 py-1.5 text-mist"
            >
              {toMonth(next)} →
            </a>
          ) : null}
        </div>
      </div>

      {partnerSites.length === 0 ? (
        <p className="text-sm text-mist">
          No sites are linked to your account yet. Contact Glint ops.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-carbon-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-carbon-border text-left text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  <th className="px-4 py-3">Site</th>
                  <th className="px-3 py-3">Wash revenue</th>
                  <th className="px-3 py-3">Subscription revenue</th>
                  <th className="px-3 py-3">Gross</th>
                </tr>
              </thead>
              <tbody>
                {statementRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-carbon-border last:border-0"
                  >
                    <td className="px-4 py-3 text-white">{r.name}</td>
                    <td className="px-3 py-3 text-mist">
                      {fmtR(r.bookingCents)}
                    </td>
                    <td className="px-3 py-3 text-mist">{fmtR(r.subsCents)}</td>
                    <td className="px-3 py-3 text-white">{fmtR(r.gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-card border border-carbon-border bg-carbon-mid p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-mist">Gross revenue, all sites</span>
              <span className="text-white">{fmtR(grossTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-carbon-border pt-2">
              <span className="text-sm text-mist">
                Revenue share ({sharePct}%)
              </span>
              <span className="text-xl font-semibold text-white">
                {fmtR(shareCents)}
              </span>
            </div>
          </div>

          <p className="text-xs text-steel">
            Attribution: booking-linked payments count toward the booked
            site; subscription payments count toward the subscriber&apos;s
            home site. Completed payments only, dated {month}.
          </p>
        </>
      )}
    </div>
  );
}
