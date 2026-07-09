import { requireRole } from "@/lib/guard";
import { signOutAction } from "../(auth)/actions";
import { Wordmark } from "@/components/wordmark";
import { TabNav, type TabItem } from "@/components/tab-nav";

const NAV: TabItem[] = [
  { href: "/ops", label: "Dashboard", icon: "gauge" },
  { href: "/ops/escalations", label: "Escalations", icon: "alert" },
  { href: "/ops/audits", label: "Audits", icon: "shield" },
  { href: "/ops/sites", label: "Sites", icon: "building" },
  { href: "/ops/team", label: "Team", icon: "users" },
  { href: "/ops/support", label: "Support", icon: "message" },
];

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ops_admin"]);
  return (
    <div className="mx-auto min-h-dvh max-w-5xl pb-16">
      <div className="glass-strong sticky top-0 z-50 border-x-0 border-t-0 px-4 sm:px-6">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-baseline gap-2">
            <Wordmark className="text-2xl text-white" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Ops
            </span>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn-secondary px-4 py-1.5 text-sm">
              Sign out
            </button>
          </form>
        </header>
        <TabNav
          items={NAV}
          rootHref="/ops"
          className="!justify-start gap-1 overflow-x-auto pb-2"
        />
      </div>
      <main className="px-4 pt-6 sm:px-6">
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
