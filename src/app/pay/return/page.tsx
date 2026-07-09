import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";

// The return redirect is never trusted as proof of payment. The payment
// stays pending until PayFast's ITN is verified server-side.
export default async function PaymentReturnPage() {
  await requireRole(CUSTOMER_ROLES);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
        Glint
      </span>
      <h1 className="mt-8 text-3xl font-bold tracking-[-0.02em]">
        Payment received. We&apos;ll confirm in a moment.
      </h1>
      <p className="mt-3 text-mist">
        Your payment shows as pending until PayFast confirms it with us
        directly. You&apos;ll get a notification once it clears.
      </p>
      <Link
        href="/app"
        className="mt-8 btn-secondary px-8 py-4 text-center "
      >
        Back to your dashboard
      </Link>
    </main>
  );
}
