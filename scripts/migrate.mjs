// Runs Drizzle migrations at deploy time using the DATABASE_URL that Vercel
// injects into the build environment. Sensitive env vars are available to the
// build but cannot be pulled via CLI, so this is how production gets migrated.
// Idempotent (Drizzle tracks applied migrations) and a no-op when no database
// is configured (e.g. preview deploys without a DB), so it never fails a build.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No DATABASE_URL set — skipping migrations.");
  process.exit(0);
}

try {
  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] Migrations applied.");
} catch (err) {
  console.error("[migrate] Failed:", err);
  process.exit(1);
}
