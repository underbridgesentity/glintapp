"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { signIn } from "@/auth";
import { homeFor, CUSTOMER_ROLES, type Role } from "@/lib/roles";
import { notificationService } from "@/lib/notifications";

const signUpSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  // Self-service sign-up is customers only; staff and partner accounts
  // are provisioned by ops.
  role: z.enum(["residential_subscriber", "fleet_manager", "once_off"]),
});

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) redirect("/sign-up?error=invalid");

  const { name, email, password, role } = parsed.data;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) redirect("/sign-up?error=exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning();

  await db.insert(auditLog).values({
    actorId: user.id,
    action: "user.sign_up",
    entity: "users",
    entityId: user.id,
    after: { email, role },
  });

  // Welcome the new customer (in-app row + email).
  await notificationService.send({
    recipientId: user.id,
    template: "welcome",
    payload: { name },
  });

  await signIn("credentials", { email, password, redirect: false });
  redirect(homeFor(role));
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  callbackUrl: z.string().optional(),
});

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });
  if (!parsed.success) redirect("/sign-in?error=1");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) redirect("/sign-in?error=1");
    throw err;
  }

  if (parsed.data.callbackUrl?.startsWith("/")) {
    redirect(parsed.data.callbackUrl);
  }
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  redirect(homeFor((user?.role as Role) ?? CUSTOMER_ROLES[0]));
}

export async function signOutAction() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/" });
}
