import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sites } from "@/db/schema";

// Resolve the technician's assigned site from their profile.
// Returns null when no site is assigned; pages render an empty state.
export async function assignedSiteFor(userId: string) {
  const [profile] = await db
    .select({ assignedSiteId: profiles.assignedSiteId })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile?.assignedSiteId) return null;

  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, profile.assignedSiteId))
    .limit(1);
  return site ?? null;
}
