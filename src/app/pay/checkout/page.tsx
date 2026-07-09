import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { payfastProvider } from "@/lib/payments/payfast";
import { CATALOG, formatRands, type CatalogKey } from "@/lib/payments/catalog";
import { createPaymentAction } from "./actions";

const searchSchema = z.object({
  payment: z.string().uuid().optional(),
});

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const raw = await searchParams;
  const params = searchSchema.safeParse({
    payment: typeof raw.payment === "string" ? raw.payment : undefined,
  });
  const requestedId = params.success ? params.data.payment : undefined;

  // Query-param payment, falling back to the user's latest pending payment.
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, session.user.id),
        eq(payments.status, "pending"),
        ...(requestedId ? [eq(payments.id, requestedId)] : [])
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);

  if (!payment) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Choose a plan</h1>
        <p className="mt-3 text-mist">
          Nothing is waiting for payment. Pick an option to continue.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {(Object.keys(CATALOG) as CatalogKey[]).map((key) => {
            const entry = CATALOG[key];
            return (
              <form key={key} action={createPaymentAction}>
                <input type="hidden" name="item" value={key} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-card border border-carbon-border bg-carbon-mid px-6 py-5 text-left hover:bg-carbon-raise"
                >
                  <span>
                    <span className="block font-semibold text-white">
                      {entry.label}
                    </span>
                    <span className="block text-sm text-mist">
                      {entry.description}
                    </span>
                  </span>
                  <span className="font-semibold text-white">
                    {formatRands(entry.amountCents)}
                    {entry.recurring ? (
                      <span className="text-sm font-normal text-mist">
                        {" "}
                        /mo
                      </span>
                    ) : null}
                  </span>
                </button>
              </form>
            );
          })}
        </div>
      </Shell>
    );
  }

  const isSubscription = payment.type === "subscription_recurring";
  const itemName = isSubscription ? "Glint subscription" : "Glint wash";

  // Signature is built here, server-side only. The client sees the signed
  // fields but never the passphrase or the signing logic.
  const checkout = isSubscription
    ? payfastProvider.createSubscriptionCheckout({
        paymentId: payment.id,
        amountCents: payment.amountCents,
        recurringAmountCents: payment.amountCents,
        itemName,
        customerEmail: session.user.email ?? undefined,
        customerName: session.user.name ?? undefined,
      })
    : payfastProvider.createOnceOffCheckout({
        paymentId: payment.id,
        amountCents: payment.amountCents,
        itemName,
        customerEmail: session.user.email ?? undefined,
        customerName: session.user.name ?? undefined,
      });

  return (
    <Shell>
      <h1 className="text-3xl font-bold tracking-[-0.02em]">Checkout</h1>
      <p className="mt-3 text-mist">
        You are paying with PayFast. You will be redirected to complete the
        payment securely.
      </p>

      <dl className="mt-8 rounded-card border border-carbon-border bg-carbon-mid p-6">
        <div className="flex items-center justify-between">
          <dt className="text-mist">{itemName}</dt>
          <dd className="font-semibold text-white">
            {formatRands(payment.amountCents)}
            {isSubscription ? (
              <span className="text-sm font-normal text-mist"> /mo</span>
            ) : null}
          </dd>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-carbon-border pt-3">
          <dt className="text-sm text-mist">Reference</dt>
          <dd className="text-sm text-mist">{payment.id.slice(0, 8)}</dd>
        </div>
      </dl>

      <form action={checkout.processUrl} method="post" className="mt-8">
        {Object.entries(checkout.fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className="w-full rounded-pill bg-lemon px-8 py-4 font-semibold text-carbon"
        >
          Pay with PayFast
        </button>
      </form>
      <p className="mt-4 text-sm text-mist">
        Your payment is confirmed once PayFast notifies us directly.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-12">
      <header className="mb-12">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Glint
        </span>
      </header>
      {children}
    </main>
  );
}
