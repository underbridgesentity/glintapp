import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/wordmark";

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
      <header className="glass sticky top-0 z-50 flex items-center justify-between border-x-0 border-t-0 px-6 py-4">
        <Link href="/app" aria-label="Glint home">
          <Wordmark className="text-2xl text-white" />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="btn-press rounded-pill border border-carbon-border px-4 py-1.5 text-xs font-medium text-mist"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pb-28 pt-6">{children}</main>

      <nav className="glass fixed inset-x-0 bottom-0 z-50 border-x-0 border-b-0">
        <div className="mx-auto flex max-w-md justify-between px-6 py-3 sm:max-w-2xl">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-pill px-3 py-1.5 text-xs font-medium text-mist transition-colors duration-300 hover:text-white"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
