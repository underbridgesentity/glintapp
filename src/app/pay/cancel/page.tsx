import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";

export default async function PaymentCancelPage() {
  await requireRole(CUSTOMER_ROLES);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
        Glint
      </span>
      <h1 className="mt-8 text-3xl font-bold tracking-[-0.02em]">
        Payment cancelled
      </h1>
      <p className="mt-3 text-mist">
        Nothing was charged. You can pick up where you left off whenever
        you&apos;re ready.
      </p>
      <Link
        href="/pay/checkout"
        className="mt-8 rounded-pill border border-carbon-border px-8 py-4 text-center font-semibold text-white"
      >
        Return to checkout
      </Link>
    </main>
  );
}
