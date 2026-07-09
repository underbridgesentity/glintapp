import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { assignedSiteFor } from "./data";

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  const isLead = session.user.role === "site_lead";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6 sm:max-w-2xl">
      <header className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Glint
          </span>
          <h1 className="text-lg font-semibold text-white">
            {site?.name ?? "No site assigned"}
          </h1>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-pill border border-carbon-border px-4 py-2 text-sm text-mist"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav className="mt-4 flex gap-2">
        <Link
          href="/tech"
          className="rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
        >
          Queue
        </Link>
        <Link
          href="/tech/keys"
          className="rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
        >
          Keys
        </Link>
        {isLead ? (
          <Link
            href="/tech/report"
            className="rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
          >
            Report
          </Link>
        ) : null}
      </nav>

      <main className="mt-6 flex-1">{children}</main>
    </div>
  );
}
