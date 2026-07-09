import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/wordmark";
import { TabNav, type TabItem } from "@/components/tab-nav";
import { assignedSiteFor } from "./data";

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  const isLead = session.user.role === "site_lead";

  const tabs: TabItem[] = [
    { href: "/tech", label: "Queue", icon: "list" },
    { href: "/tech/keys", label: "Keys", icon: "key" },
    ...(isLead
      ? [{ href: "/tech/report", label: "Report", icon: "gauge" } as TabItem]
      : []),
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col sm:max-w-2xl">
      <div className="glass-strong sticky top-0 z-50 border-x-0 border-t-0 px-4 pb-3 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <Wordmark className="text-2xl text-white" />
            <h1 className="mt-1 text-lg font-semibold text-white">
              {site?.name ?? "No site assigned"}
            </h1>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">
              Sign out
            </button>
          </form>
        </header>

        <TabNav items={tabs} rootHref="/tech" className="mt-3 !justify-start gap-2" />
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
