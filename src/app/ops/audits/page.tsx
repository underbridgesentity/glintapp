import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mysteryShopperAudits, sites, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { createAudit } from "../actions";

export const dynamic = "force-dynamic";

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(["ops_admin"]);
  const { error } = await searchParams;

  const [siteRows, auditRows] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(isNull(sites.deletedAt))
      .orderBy(sites.name),
    db
      .select({
        id: mysteryShopperAudits.id,
        score: mysteryShopperAudits.score,
        findings: mysteryShopperAudits.findings,
        createdAt: mysteryShopperAudits.createdAt,
        siteName: sites.name,
        auditorName: users.name,
      })
      .from(mysteryShopperAudits)
      .innerJoin(sites, eq(mysteryShopperAudits.siteId, sites.id))
      .innerJoin(users, eq(mysteryShopperAudits.auditorId, users.id))
      .orderBy(desc(mysteryShopperAudits.createdAt))
      .limit(50),
  ]);

  return (
    <div className="flex flex-col gap-8 pt-4">
      <h1 className="text-2xl font-bold tracking-[-0.025em]">
        Mystery-shopper audits
      </h1>

      {error ? (
        <p className="surface-1 rounded-card px-4 py-3 text-sm text-white">
          Check the form. Score is 1 to 5, findings are required.
        </p>
      ) : null}

      <section className="surface-1 rounded-card p-4">
        <h2 className="text-lg font-semibold text-white">New audit</h2>
        {siteRows.length === 0 ? (
          <p className="mt-2 text-sm text-mist">
            No sites to audit yet. Add one under Sites first.
          </p>
        ) : (
          <form action={createAudit} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Site
              </span>
              <select
                name="siteId"
                required
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              >
                {siteRows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Booking ID (optional)
              </span>
              <input
                name="bookingId"
                placeholder="UUID of the audited booking"
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Score (1–5)
              </span>
              <select
                name="score"
                required
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Findings
              </span>
              <textarea
                name="findings"
                required
                rows={4}
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              />
            </label>
            <button
              type="submit"
              className="self-start btn-primary px-6 py-3 text-sm"
            >
              Record audit
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">
          History ({auditRows.length})
        </h2>
        {auditRows.length === 0 ? (
          <p className="mt-2 text-sm text-mist">No audits recorded yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {auditRows.map((a) => (
              <li
                key={a.id}
                className="rounded-card border border-carbon-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-white">
                    {a.siteName} · {a.score}/5
                  </span>
                  <span className="text-xs text-steel">
                    {a.createdAt.toISOString().slice(0, 10)} · {a.auditorName}
                  </span>
                </div>
                <p className="mt-1 text-sm text-mist">{a.findings}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
