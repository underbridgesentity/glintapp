// PayFast ITN webhook. This is the only place a payment is ever marked
// complete — client-reported success (the return page) is never trusted.
// Every ITN, valid or not, is recorded as an append-only payment_events row.
// We always return 200 for handled requests so PayFast does not retry
// rejected ITNs; genuine server errors bubble to a 5xx so PayFast retries.
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  auditLog,
  paymentEvents,
  payments,
  subscriptions,
} from "@/db/schema";
import { notificationService } from "@/lib/notifications";
import { payfastProvider, parseItnBody } from "@/lib/payments/payfast";

export const runtime = "nodejs";

const ok = () => new Response("OK", { status: 200 });

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  let data: Record<string, string>;
  try {
    data = parseItnBody(rawBody);
  } catch {
    await db.insert(paymentEvents).values({
      signatureValid: false,
      hostValid: false,
      amountMatched: false,
      outcome: "unparseable",
      rawPayload: { rawBody },
    });
    return ok();
  }

  // Look up the originating payments row via m_payment_id (our payments.id).
  const paymentId = z.string().uuid().safeParse(data.m_payment_id);
  const payment = paymentId.success
    ? (
        await db
          .select()
          .from(payments)
          .where(eq(payments.id, paymentId.data))
          .limit(1)
      )[0]
    : undefined;

  const result = await payfastProvider.verifyItn({
    rawBody,
    sourceIp,
    expectedAmountCents: payment?.amountCents ?? null,
  });

  // (d) Idempotency: a pf_payment_id already processed is never re-applied.
  if (result.providerPaymentId) {
    const [existing] = await db
      .select({ id: paymentEvents.id })
      .from(paymentEvents)
      .where(
        and(
          eq(paymentEvents.pfPaymentId, result.providerPaymentId),
          eq(paymentEvents.outcome, "processed")
        )
      )
      .limit(1);
    if (existing) {
      await db.insert(paymentEvents).values({
        paymentId: payment?.id ?? null,
        pfPaymentId: result.providerPaymentId,
        signatureValid: result.signatureValid,
        hostValid: result.hostValid,
        amountMatched: result.amountMatched,
        outcome: "duplicate",
        rawPayload: result.data,
      });
      return ok();
    }
  }

  const outcome = !result.signatureValid
    ? "invalid_signature"
    : !result.hostValid
      ? "invalid_host"
      : !payment
        ? "unknown_payment"
        : !result.amountMatched
          ? "amount_mismatch"
          : result.providerStatus !== "COMPLETE"
            ? `ignored_status_${(result.providerStatus ?? "none").toLowerCase()}`
            : "processed";

  await db.insert(paymentEvents).values({
    paymentId: payment?.id ?? null,
    pfPaymentId: result.providerPaymentId,
    signatureValid: result.signatureValid,
    hostValid: result.hostValid,
    amountMatched: result.amountMatched,
    outcome,
    rawPayload: result.data,
  });

  if (outcome !== "processed" || !payment || !result.processable) return ok();

  const before = { status: payment.status, providerRef: payment.providerRef };

  await db
    .update(payments)
    .set({
      status: "complete",
      providerRef: result.providerPaymentId,
      method: result.method,
      rawItnPayload: result.data,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  if (payment.subscriptionId) {
    await db
      .update(subscriptions)
      .set({
        status: "active",
        payfastToken: result.subscriptionToken,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, payment.subscriptionId));
  }

  await db.insert(auditLog).values({
    actorId: null, // system action, triggered by the provider
    action: "payment.completed",
    entity: "payments",
    entityId: payment.id,
    before,
    after: {
      status: "complete",
      providerRef: result.providerPaymentId,
      subscriptionActivated: Boolean(payment.subscriptionId),
    },
  });

  await notificationService.send({
    recipientId: payment.userId,
    template: "payment_received",
    payload: {
      paymentId: payment.id,
      amountCents: payment.amountCents,
      providerRef: result.providerPaymentId,
    },
  });

  return ok();
}
