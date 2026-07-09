import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { selectPlanAction } from "../actions";
import { PLAN_PRICING, PLAN_LABELS, formatRands } from "../pricing";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  past_due: "Past due",
  paused: "Paused",
  cancelled: "Cancelled",
};

const PLAN_DETAIL: Record<keyof typeof PLAN_PRICING, string> = {
  basic: "4 exterior washes a month. 1 vehicle.",
  premium: "4 washes a month, interior included. 1 vehicle.",
  fleet: "Per vehicle, per month. Consolidated invoice.",
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { saved, error } = await searchParams;
  const isFleet = session.user.role === "fleet_manager";

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

  const availablePlans = (
    Object.keys(PLAN_PRICING) as (keyof typeof PLAN_PRICING)[]
  ).filter((p) => (isFleet ? p === "fleet" : p !== "fleet"));

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
        Plan
      </h1>

      {saved ? (
        <p className="text-sm text-white">
          Plan updated. Billing follows from your next anchor day.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-white">That did not save. Try again.</p>
      ) : null}

      {subscription ? (
        <div className="rounded-card border border-carbon-border bg-carbon-mid p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-white">
              {PLAN_LABELS[subscription.plan]}
            </p>
            {subscription.status === "active" ? (
              <span className="rounded-pill bg-lemon-dim px-3 py-1 text-xs font-semibold text-lemon">
                Active
              </span>
            ) : (
              <span className="rounded-pill border border-carbon-border px-3 py-1 text-xs text-mist">
                {STATUS_LABEL[subscription.status]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-mist">
            {formatRands(subscription.monthlyAmountCents)} a month
            {subscription.plan === "fleet" ? " per vehicle" : ""}. Next billing
            day: {subscription.billingAnchorDay} of the month.
          </p>
          <Link
            href="/app/schedule"
            className="mt-3 inline-block text-sm text-white underline underline-offset-4"
          >
            Set scheduled wash days
          </Link>
        </div>
      ) : (
        <p className="text-sm text-mist">
          No plan yet. Pick one below. Cancel anytime.
        </p>
      )}

      <section className="flex flex-col gap-3">
        {availablePlans.map((plan) => {
          const current = subscription?.plan === plan;
          return (
            <div
              key={plan}
              className="rounded-card border border-carbon-border bg-carbon-mid p-5"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-white">{PLAN_LABELS[plan]}</p>
                <p className="text-sm text-mist">
                  {formatRands(PLAN_PRICING[plan])}
                  {plan === "fleet" ? " per vehicle" : ""} / month
                </p>
              </div>
              <p className="mt-1 text-xs text-mist">{PLAN_DETAIL[plan]}</p>
              {current ? (
                <p className="mt-3 text-xs font-medium text-steel">
                  Your current plan
                </p>
              ) : (
                <form action={selectPlanAction} className="mt-3">
                  <input type="hidden" name="plan" value={plan} />
                  <button
                    type="submit"
                    className="rounded-pill bg-lemon px-6 py-2.5 text-sm font-semibold text-carbon"
                  >
                    {subscription ? "Switch to this plan" : "Choose this plan"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      <p className="text-xs text-steel">
        Payment is set up at{" "}
        <a href="/pay/checkout" className="underline underline-offset-4">
          checkout
        </a>
        . Your plan starts once payment clears.
      </p>
    </div>
  );
}
