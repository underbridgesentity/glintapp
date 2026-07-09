import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, sites } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { bookWashAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-card border border-carbon-border bg-carbon-mid px-4 py-3 text-sm text-white";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { error } = await searchParams;

  const [myVehicles, allSites] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(
        and(eq(vehicles.ownerId, session.user.id), isNull(vehicles.deletedAt))
      )
      .orderBy(vehicles.createdAt),
    db.select().from(sites).where(isNull(sites.deletedAt)).orderBy(sites.name),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  if (myVehicles.length === 0) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Book a wash
        </h1>
        <p className="mt-3 text-sm text-mist">
          Add a vehicle first. Then booking takes 20 seconds.
        </p>
        <Link
          href="/app/vehicles"
          className="mt-6 inline-block rounded-pill bg-lemon px-8 py-3.5 font-semibold text-carbon"
        >
          Add a vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
        Book a wash
      </h1>
      {error ? (
        <p className="text-sm text-white">
          That booking did not go through. Check the details and try again.
        </p>
      ) : null}
      <form action={bookWashAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mist">
          Vehicle
          <select name="vehicleId" required className={inputClass}>
            {myVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.colour} {v.make} {v.model} — {v.plate}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-mist">
          Site
          <select name="siteId" required className={inputClass}>
            {allSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-mist">
          Date
          <input
            type="date"
            name="scheduledDate"
            min={today}
            defaultValue={today}
            required
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-mist">
          Wash type
          <select name="washType" required className={inputClass}>
            <option value="exterior">Exterior</option>
            <option value="interior_exterior">Interior and exterior</option>
          </select>
        </label>

        <button
          type="submit"
          className="mt-2 rounded-pill bg-lemon px-8 py-4 font-semibold text-carbon"
        >
          Confirm booking
        </button>
        <p className="text-xs text-steel">
          Book before 8am. Clean by noon. Washes run 09:00-15:00.
        </p>
      </form>
    </div>
  );
}
