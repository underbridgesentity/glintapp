import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { signOutAction } from "../(auth)/actions";

const NAV = [
  { href: "/ops", label: "Dashboard" },
  { href: "/ops/escalations", label: "Escalations" },
  { href: "/ops/audits", label: "Audits" },
  { href: "/ops/sites", label: "Sites" },
  { href: "/ops/team", label: "Team" },
];

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ops_admin"]);
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between border-b border-carbon-border py-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Glint ops
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-pill border border-carbon-border px-4 py-1.5 text-sm text-mist"
          >
            Sign out
          </button>
        </form>
      </header>
      <nav className="flex gap-1 overflow-x-auto py-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-pill px-4 py-1.5 text-sm text-mist hover:bg-carbon-raise hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}
