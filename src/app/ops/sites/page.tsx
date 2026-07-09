import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { siteRequirements, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { createSite, updateDailyTarget } from "../actions";

export const dynamic = "force-dynamic";

const REQ_LABELS: [keyof RequirementFlags, string][] = [
  ["parkingBays", "Parking bays"],
  ["powerOutlet", "Power outlet"],
  ["storageCage", "Storage cage"],
  ["signagePermission", "Signage permission"],
];

type RequirementFlags = {
  parkingBays: boolean;
  powerOutlet: boolean;
  storageCage: boolean;
  signagePermission: boolean;
};

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(["ops_admin"]);
  const { error } = await searchParams;

  const rows = await db
    .select({
      id: sites.id,
      name: sites.name,
      type: sites.type,
      address: sites.address,
      dailyTarget: sites.dailyTarget,
      operatingHours: sites.operatingHours,
      parkingBays: siteRequirements.parkingBays,
      powerOutlet: siteRequirements.powerOutlet,
      storageCage: siteRequirements.storageCage,
      signagePermission: siteRequirements.signagePermission,
      lockboxLocation: siteRequirements.lockboxLocation,
    })
    .from(sites)
    .leftJoin(siteRequirements, eq(siteRequirements.siteId, sites.id))
    .where(isNull(sites.deletedAt))
    .orderBy(sites.name);

  return (
    <div className="flex flex-col gap-8 pt-4">
      <h1 className="text-2xl font-bold tracking-[-0.025em]">Sites</h1>

      {error ? (
        <p className="rounded-card border border-carbon-border bg-carbon-mid px-4 py-3 text-sm text-white">
          Check the form. Hours are HH:MM-HH:MM, target is 1 to 500.
        </p>
      ) : null}

      <section>
        {rows.length === 0 ? (
          <p className="text-sm text-mist">
            No sites yet. Add the first one below.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((s) => (
              <li
                key={s.id}
                className="rounded-card border border-carbon-border bg-carbon-mid p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-xs text-steel">
                    {s.type.replace("_", " ")} · {s.operatingHours}
                  </span>
                </div>
                <p className="mt-1 text-sm text-mist">{s.address}</p>
                <p className="mt-1 text-sm text-mist">
                  {REQ_LABELS.filter(
                    ([k]) => (s as unknown as RequirementFlags)[k],
                  )
                    .map(([, label]) => label)
                    .join(" · ") || "No requirements recorded"}
                  {s.lockboxLocation ? ` · Lockbox: ${s.lockboxLocation}` : ""}
                </p>
                <form
                  action={updateDailyTarget}
                  className="mt-3 flex items-end gap-2"
                >
                  <input type="hidden" name="siteId" value={s.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                      Daily target
                    </span>
                    <input
                      name="dailyTarget"
                      type="number"
                      min={1}
                      max={500}
                      defaultValue={s.dailyTarget}
                      className="w-24 rounded-card border border-carbon-border bg-carbon-raise px-3 py-2 text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-pill border border-carbon-border px-4 py-2 text-sm text-white"
                  >
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-carbon-border bg-carbon-mid p-4">
        <h2 className="text-lg font-semibold text-white">Add site</h2>
        <form action={createSite} className="mt-4 flex flex-col gap-4">
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
              Type
            </span>
            <select
              name="type"
              required
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            >
              <option value="residential_estate">Residential estate</option>
              <option value="office_park">Office park</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Address
            </span>
            <input
              name="address"
              required
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Daily target
              </span>
              <input
                name="dailyTarget"
                type="number"
                min={1}
                max={500}
                defaultValue={35}
                required
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                Operating hours
              </span>
              <input
                name="operatingHours"
                defaultValue="09:00-15:00"
                pattern="\d{2}:\d{2}-\d{2}:\d{2}"
                required
                className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
              />
            </label>
          </div>
          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Requirements
            </legend>
            {REQ_LABELS.map(([name, label]) => (
              <label
                key={name}
                className="flex items-center gap-2 text-sm text-white"
              >
                <input type="checkbox" name={name} className="accent-current" />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Lockbox location (optional)
            </span>
            <input
              name="lockboxLocation"
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-pill bg-lemon px-6 py-3 text-sm font-semibold text-carbon"
          >
            Add site
          </button>
        </form>
      </section>
    </div>
  );
}
