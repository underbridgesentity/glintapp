import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";

const TABS = [
  { href: "/app", label: "Home" },
  { href: "/app/vehicles", label: "Vehicles" },
  { href: "/app/history", label: "History" },
  { href: "/app/plan", label: "Plan" },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(CUSTOMER_ROLES);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col sm:max-w-2xl">
      <header className="flex items-center justify-between px-6 pb-4 pt-8">
        <Link
          href="/app"
          className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist"
        >
          Glint
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-pill border border-carbon-border px-4 py-1.5 text-xs font-medium text-mist"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-carbon-border bg-carbon-mid">
        <div className="mx-auto flex max-w-md justify-between px-6 py-3 sm:max-w-2xl">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-pill px-3 py-1.5 text-xs font-medium text-mist"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
