import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { addVehicleAction, removeVehicleAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "surface-1 rounded-card px-4 py-3 text-sm text-white placeholder:text-steel";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { error } = await searchParams;

  const myVehicles = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.ownerId, session.user.id), isNull(vehicles.deletedAt))
    )
    .orderBy(vehicles.createdAt);

  return (
    <div className="flex flex-col gap-8 py-4">
      <section>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Vehicles
        </h1>
        {myVehicles.length === 0 ? (
          <p className="mt-3 text-sm text-mist">
            No vehicles yet. Add your first below. 30 seconds.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {myVehicles.map((v) => (
              <li
                key={v.id}
                className="surface-1 rounded-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {v.colour} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-mist">{v.plate}</p>
                    {v.notes ? (
                      <p className="mt-1 text-xs text-steel">{v.notes}</p>
                    ) : null}
                  </div>
                  <form action={removeVehicleAction}>
                    <input type="hidden" name="vehicleId" value={v.id} />
                    <button
                      type="submit"
                      className="rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-mist">
          Add a vehicle
        </h2>
        {error ? (
          <p className="mt-2 text-sm text-white">
            Check the details and try again. All fields except notes are
            required.
          </p>
        ) : null}
        <form action={addVehicleAction} className="mt-3 flex flex-col gap-3">
          <input name="make" placeholder="Make" required className={inputClass} />
          <input
            name="model"
            placeholder="Model"
            required
            className={inputClass}
          />
          <input
            name="colour"
            placeholder="Colour"
            required
            className={inputClass}
          />
          <input
            name="plate"
            placeholder="Plate"
            required
            className={inputClass}
          />
          <input
            name="photoUrl"
            type="url"
            placeholder="Photo URL (optional)"
            className={inputClass}
          />
          <textarea
            name="notes"
            placeholder="Notes for the technician (optional)"
            rows={2}
            className={inputClass}
          />
          <button
            type="submit"
            className="btn-primary px-8 py-3.5"
          >
            Add vehicle
          </button>
        </form>
      </section>
    </div>
  );
}
