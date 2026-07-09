import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { signOutAction } from "../(auth)/actions";
import { Wordmark } from "@/components/wordmark";
import { Icon, type IconName } from "@/components/icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
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
      <div className="glass sticky top-0 z-50 border-x-0 border-t-0 px-4 sm:px-6">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-baseline gap-2">
            <Wordmark className="text-2xl text-white" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              Ops
            </span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn-press rounded-pill border border-carbon-border px-4 py-1.5 text-sm text-mist"
            >
              Sign out
            </button>
          </form>
        </header>
        <nav className="flex gap-1 overflow-x-auto pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-1.5 text-sm text-mist transition-colors duration-300 hover:bg-carbon-raise hover:text-white"
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="px-4 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
