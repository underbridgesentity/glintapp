import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { signOutAction } from "../(auth)/actions";

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
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between border-b border-carbon-border py-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Glint × {profile?.partnerOrgName ?? "Partner"}
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
      <nav className="flex gap-1 py-3">
        <Link
          href="/partner"
          className="rounded-pill px-4 py-1.5 text-sm text-mist hover:bg-carbon-raise hover:text-white"
        >
          Amenity
        </Link>
        <Link
          href="/partner/statement"
          className="rounded-pill px-4 py-1.5 text-sm text-mist hover:bg-carbon-raise hover:text-white"
        >
          Statement
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
