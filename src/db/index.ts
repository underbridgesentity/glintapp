import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Lazy so the app builds without DATABASE_URL; connections happen at
// request time.
let _db: NeonHttpDatabase<typeof schema> | undefined;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const value = getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
