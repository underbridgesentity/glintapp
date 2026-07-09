// One-time production bootstrap: creates the first ops_admin account so the
// rest of the platform (sites, technicians) can be provisioned through the
// product UI. Runs at deploy time after migrations, only when both
// BOOTSTRAP_OPS_EMAIL and BOOTSTRAP_OPS_PASSWORD are set, and never
// overwrites an existing user (idempotent). Remove the env vars after use.
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
const email = process.env.BOOTSTRAP_OPS_EMAIL;
const password = process.env.BOOTSTRAP_OPS_PASSWORD;

if (!url || !email || !password) {
  console.log("[bootstrap-ops] Not configured — skipping.");
  process.exit(0);
}

try {
  const sql = neon(url);
  const existing = await sql`select id from users where email = ${email} limit 1`;
  if (existing.length > 0) {
    console.log("[bootstrap-ops] Ops user already exists — skipping.");
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  await sql`
    insert into users (email, password_hash, name, role)
    values (${email}, ${hash}, 'Glint Operations', 'ops_admin')
  `;
  console.log("[bootstrap-ops] Ops admin created:", email);
} catch (err) {
  // Bootstrap is a convenience; never fail the build over it.
  console.error("[bootstrap-ops] Failed (non-fatal):", err.message ?? err);
}
