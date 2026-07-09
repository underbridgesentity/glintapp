import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/lib/roles";

// Server-side RBAC guard. Call at the top of every protected page,
// layout, server action, and route handler.
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (!allowed.includes(session.user.role)) redirect("/");
  return session;
}
