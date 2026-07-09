import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/wordmark";
import { Icon } from "@/components/icons";
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col sm:max-w-2xl">
      <div className="glass sticky top-0 z-50 border-x-0 border-t-0 px-4 pb-4 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <Wordmark className="text-2xl text-white" />
            <h1 className="mt-1 text-lg font-semibold text-white">
              {site?.name ?? "No site assigned"}
            </h1>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn-press rounded-pill border border-carbon-border px-4 py-2 text-sm text-mist"
            >
              Sign out
            </button>
          </form>
        </header>

        <nav className="mt-4 flex gap-2">
          <Link
            href="/tech"
            className="btn-press inline-flex items-center gap-2 rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
          >
            <Icon name="list" size={16} className="text-mist" />
            Queue
          </Link>
          <Link
            href="/tech/keys"
            className="btn-press inline-flex items-center gap-2 rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
          >
            <Icon name="key" size={16} className="text-mist" />
            Keys
          </Link>
          {isLead ? (
            <Link
              href="/tech/report"
              className="btn-press inline-flex items-center gap-2 rounded-pill bg-carbon-raise px-4 py-2 text-sm font-medium text-white"
            >
              <Icon name="gauge" size={16} className="text-mist" />
              Report
            </Link>
          ) : null}
        </nav>
      </div>

      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
