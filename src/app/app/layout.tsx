import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/wordmark";
import { TabNav, type TabItem } from "@/components/tab-nav";

const TABS: TabItem[] = [
  { href: "/app", label: "Home", icon: "home" },
  { href: "/app/vehicles", label: "Vehicles", icon: "car" },
  { href: "/app/history", label: "History", icon: "list" },
  { href: "/app/plan", label: "Plan", icon: "creditCard" },
  { href: "/app/support", label: "Support", icon: "message" },
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
            className="btn-secondary px-4 py-1.5 text-xs"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pb-28 pt-6">
        <div className="page-enter">{children}</div>
      </main>

      <nav className="glass fixed inset-x-0 bottom-0 z-50 border-x-0 border-b-0">
        <TabNav
          items={TABS}
          rootHref="/app"
          className="mx-auto max-w-md px-4 py-2 sm:max-w-2xl"
        />
      </nav>
    </div>
  );
}
