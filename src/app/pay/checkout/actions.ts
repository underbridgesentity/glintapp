"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, payments, subscriptions } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { CATALOG, type CatalogKey } from "@/lib/payments/catalog";

const itemSchema = z.enum(
  Object.keys(CATALOG) as [CatalogKey, ...CatalogKey[]]
);

// Creates the pending payments row (and a paused subscription for recurring
// plans) plus an audit trail entry, then sends the user back to checkout to
// confirm and pay. Amounts come from the server-side catalog only.
export async function createPaymentAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const item = itemSchema.parse(formData.get("item"));
  const entry = CATALOG[item];
  const userId = session.user.id;

  let subscriptionId: string | null = null;
  if (entry.recurring && entry.plan) {
    const [sub] = await db
      .insert(subscriptions)
      .values({
        userId,
        plan: entry.plan,
        status: "paused", // activated by the ITN, never by the client
        monthlyAmountCents: entry.amountCents,
      })
      .returning({ id: subscriptions.id });
    subscriptionId = sub.id;
  }

  const [payment] = await db
    .insert(payments)
    .values({
      userId,
      subscriptionId,
      type: entry.recurring ? "subscription_recurring" : "once_off",
      amountCents: entry.amountCents,
      status: "pending",
      provider: "payfast",
    })
    .returning({ id: payments.id });

  await db.insert(auditLog).values({
    actorId: userId,
    action: "payment.created",
    entity: "payments",
    entityId: payment.id,
    after: {
      item,
      amountCents: entry.amountCents,
      subscriptionId,
      status: "pending",
    },
  });

  redirect(`/pay/checkout?payment=${payment.id}`);
}
