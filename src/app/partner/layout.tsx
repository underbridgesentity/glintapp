import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { signOutAction } from "../(auth)/actions";
import { Wordmark } from "@/components/wordmark";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["developer_partner"]);
  const [profile] = await db
    .select({ partnerOrgName: profiles.partnerOrgName })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl pb-16">
      <div className="glass sticky top-0 z-50 border-x-0 border-t-0 px-4 sm:px-6">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-baseline gap-2">
            <Wordmark className="text-2xl text-white" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              × {profile?.partnerOrgName ?? "Partner"}
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
        <nav className="flex gap-1 pb-3">
          <Link
            href="/partner"
            className="rounded-pill px-4 py-1.5 text-sm text-mist transition-colors duration-300 hover:bg-carbon-raise hover:text-white"
          >
            Amenity
          </Link>
          <Link
            href="/partner/statement"
            className="rounded-pill px-4 py-1.5 text-sm text-mist transition-colors duration-300 hover:bg-carbon-raise hover:text-white"
          >
            Statement
          </Link>
        </nav>
      </div>
      <main className="px-4 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
