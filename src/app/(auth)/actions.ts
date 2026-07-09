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

// --- Password reset ---
// Request: never reveals whether an email exists. Token: 32 random bytes,
// only the SHA-256 hash stored, 30-minute expiry, single use.

const requestResetSchema = z.object({ email: z.string().email() });

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  // Uniform response either way — no user enumeration.
  if (!parsed.success) redirect("/forgot-password?sent=1");

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (user) {
    const { randomBytes, createHash } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const { passwordResetTokens } = await import("@/db/schema");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { sendEmail } = await import("@/lib/email/resend");
    const { renderEmail } = await import("@/lib/email/templates");
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const email = renderEmail(
      "password_reset",
      { resetUrl: `${base}/reset-password?token=${token}` },
      user.name
    );
    if (email) await sendEmail({ to: user.email, ...email });
  }

  redirect("/forgot-password?sent=1");
}

const resetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(8).max(200),
});

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/forgot-password?sent=expired");

  const { createHash } = await import("crypto");
  const { passwordResetTokens } = await import("@/db/schema");
  const { and, isNull, gt } = await import("drizzle-orm");
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!row) redirect("/forgot-password?sent=expired");

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      updatedAt: new Date(),
    })
    .where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  await db.insert(auditLog).values({
    actorId: row.userId,
    action: "user.password_reset",
    entity: "users",
    entityId: row.userId,
  });

  redirect("/sign-in?reset=1");
}
