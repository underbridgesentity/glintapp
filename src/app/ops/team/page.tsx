import { desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sites, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { provisionAccount } from "../actions";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(["ops_admin"]);
  const { error } = await searchParams;

  const [team, siteRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        siteName: sites.name,
        partnerOrgName: profiles.partnerOrgName,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(sites, eq(profiles.assignedSiteId, sites.id))
      .where(
        inArray(users.role, ["technician", "site_lead", "developer_partner"]),
      )
      .orderBy(desc(users.createdAt)),
    db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(isNull(sites.deletedAt))
      .orderBy(sites.name),
  ]);

  return (
    <div className="flex flex-col gap-8 pt-4">
      <h1 className="text-2xl font-bold tracking-[-0.025em]">Team</h1>

      {error ? (
        <p className="surface-1 rounded-card px-4 py-3 text-sm text-white">
          {error === "exists"
            ? "That email already has an account."
            : "Check the form. Password needs 8+ characters."}
        </p>
      ) : null}

      <section>
        {team.length === 0 ? (
          <p className="text-sm text-mist">
            No provisioned accounts yet. Add the first one below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {team.map((m) => (
              <li
                key={m.id}
                className="surface-1 rounded-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{m.name}</span>
                  <span className="rounded-pill bg-carbon-raise px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    {m.role.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-mist">
                  {m.email}
                  {m.siteName ? ` · ${m.siteName}` : ""}
                  {m.partnerOrgName ? ` · ${m.partnerOrgName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-1 rounded-card p-4">
        <h2 className="text-lg font-semibold text-white">Provision account</h2>
        <form action={provisionAccount} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Name
            </span>
            <input
              name="name"
              required
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Temporary password (8+ characters)
            </span>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Role
              </span>
              <select
                name="role"
                required
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              >
                <option value="technician">Technician</option>
                <option value="site_lead">Site lead</option>
                <option value="developer_partner">Developer partner</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Site (technician / site lead)
              </span>
              <select
                name="siteId"
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              >
                <option value="">No site</option>
                {siteRows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Partner org name (developer partner only)
            </span>
            <input
              name="partnerOrgName"
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            className="self-start btn-primary px-6 py-3 text-sm"
          >
            Create account
          </button>
        </form>
      </section>
    </div>
  );
}
