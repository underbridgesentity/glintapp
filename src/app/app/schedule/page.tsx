import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { updateScheduleAction } from "../actions";

export const dynamic = "force-dynamic";

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { saved, error } = await searchParams;

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);

  if (!subscription) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Scheduled washes
        </h1>
        <p className="mt-3 text-sm text-mist">
          Scheduled wash days come with a plan. Pick one and set your days.
        </p>
        <Link
          href="/app/plan"
          className="mt-6 inline-block btn-primary px-8 py-3.5"
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  const selected = (subscription.scheduledWashDays as string[]) ?? [];

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Scheduled washes
        </h1>
        <p className="mt-2 text-sm text-mist">
          Pick your wash days. We show up. You do nothing.
        </p>
      </div>

      {saved ? <p className="text-sm text-white">Saved. See you then.</p> : null}
      {error ? (
        <p className="text-sm text-white">
          That did not save. Try again.
        </p>
      ) : null}

      <form action={updateScheduleAction} className="flex flex-col gap-3">
        {DAYS.map((day) => (
          <label
            key={day.value}
            className="flex items-center justify-between surface-1 rounded-card px-4 py-3 text-sm text-white"
          >
            {day.label}
            <input
              type="checkbox"
              name="days"
              value={day.value}
              defaultChecked={selected.includes(day.value)}
              className="h-4 w-4"
            />
          </label>
        ))}
        <button
          type="submit"
          className="mt-2 btn-primary px-8 py-3.5"
        >
          Save wash days
        </button>
      </form>
    </div>
  );
}
