"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import {
  auditLog,
  bookings,
  escalations,
  mysteryShopperAudits,
  profiles,
  siteRequirements,
  sites,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { insertMessage } from "@/lib/support";
import { notificationService } from "@/lib/notifications";

async function log(
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null,
  before: unknown,
  after: unknown,
) {
  await db.insert(auditLog).values({
    actorId,
    action,
    entity,
    entityId,
    before: before ?? null,
    after: after ?? null,
  });
}

// --- Escalations ---

const assignSchema = z.object({ escalationId: z.string().uuid() });

export async function assignEscalationToSelf(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = assignSchema.safeParse({
    escalationId: formData.get("escalationId"),
  });
  if (!parsed.success) redirect("/ops/escalations?error=invalid");

  const { escalationId } = parsed.data;
  const [before] = await db
    .select()
    .from(escalations)
    .where(eq(escalations.id, escalationId))
    .limit(1);
  if (!before) redirect("/ops/escalations?error=missing");

  await db
    .update(escalations)
    .set({ assignedOpsId: session.user.id, updatedAt: new Date() })
    .where(eq(escalations.id, escalationId));

  await log(
    session.user.id,
    "escalation.assign",
    "escalations",
    escalationId,
    { assignedOpsId: before.assignedOpsId },
    { assignedOpsId: session.user.id },
  );
  revalidatePath("/ops/escalations");
}

const STATUS_FLOW: Record<string, string[]> = {
  open: ["investigating"],
  investigating: ["re_wash_scheduled", "resolved"],
  re_wash_scheduled: ["resolved"],
  resolved: [],
};

const statusSchema = z.object({
  escalationId: z.string().uuid(),
  status: z.enum(["investigating", "re_wash_scheduled", "resolved"]),
  resolution: z.string().max(2000).optional(),
});

export async function updateEscalationStatus(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = statusSchema.safeParse({
    escalationId: formData.get("escalationId"),
    status: formData.get("status"),
    resolution: formData.get("resolution") || undefined,
  });
  if (!parsed.success) redirect("/ops/escalations?error=invalid");

  const { escalationId, status, resolution } = parsed.data;
  const [before] = await db
    .select()
    .from(escalations)
    .where(eq(escalations.id, escalationId))
    .limit(1);
  if (!before) redirect("/ops/escalations?error=missing");
  if (!STATUS_FLOW[before.status]?.includes(status)) {
    redirect("/ops/escalations?error=transition");
  }

  await db
    .update(escalations)
    .set({
      status,
      resolution: resolution ?? before.resolution,
      updatedAt: new Date(),
    })
    .where(eq(escalations.id, escalationId));

  await log(
    session.user.id,
    `escalation.${status}`,
    "escalations",
    escalationId,
    { status: before.status, resolution: before.resolution },
    { status, resolution: resolution ?? before.resolution },
  );

  // Scheduling a re-wash creates a fresh booking for the same
  // vehicle and site, dated today.
  if (status === "re_wash_scheduled") {
    const [origin] = await db
      .select({
        vehicleId: bookings.vehicleId,
        siteId: bookings.siteId,
        washType: bookings.washType,
        subscriptionId: bookings.subscriptionId,
      })
      .from(bookings)
      .where(eq(bookings.id, before.bookingId))
      .limit(1);
    if (origin) {
      const today = new Date().toISOString().slice(0, 10);
      const [reWash] = await db
        .insert(bookings)
        .values({
          vehicleId: origin.vehicleId,
          siteId: origin.siteId,
          subscriptionId: origin.subscriptionId,
          scheduledDate: today,
          status: "re_wash",
          washType: origin.washType,
        })
        .returning({ id: bookings.id });
      await log(
        session.user.id,
        "booking.re_wash_created",
        "bookings",
        reWash.id,
        null,
        {
          escalationId,
          originBookingId: before.bookingId,
          scheduledDate: today,
        },
      );
    }
  }

  revalidatePath("/ops/escalations");
  revalidatePath("/ops");
}

// --- Support inbox ---

const replySchema = z.object({
  customerId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function sendOpsReplyAction(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = replySchema.safeParse({
    customerId: formData.get("customerId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/ops/support?error=invalid");

  await insertMessage({
    customerId: parsed.data.customerId,
    senderId: session.user.id,
    senderRole: "ops",
    body: parsed.data.body,
  });

  // Notify the customer (in-app row + email) that support replied.
  await notificationService.send({
    recipientId: parsed.data.customerId,
    template: "support_reply",
    payload: {},
  });

  revalidatePath("/ops/support");
  redirect(`/ops/support?customer=${parsed.data.customerId}`);
}

// --- Mystery-shopper audits ---

const auditSchema = z.object({
  siteId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  score: z.coerce.number().int().min(1).max(5),
  findings: z.string().min(3).max(4000),
});

export async function createAudit(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = auditSchema.safeParse({
    siteId: formData.get("siteId"),
    bookingId: formData.get("bookingId") || undefined,
    score: formData.get("score"),
    findings: formData.get("findings"),
  });
  if (!parsed.success) redirect("/ops/audits?error=invalid");

  const [row] = await db
    .insert(mysteryShopperAudits)
    .values({
      siteId: parsed.data.siteId,
      bookingId: parsed.data.bookingId ?? null,
      auditorId: session.user.id,
      score: parsed.data.score,
      findings: parsed.data.findings,
    })
    .returning({ id: mysteryShopperAudits.id });

  await log(
    session.user.id,
    "audit.create",
    "mystery_shopper_audits",
    row.id,
    null,
    { siteId: parsed.data.siteId, score: parsed.data.score },
  );
  revalidatePath("/ops/audits");
}

// --- Sites ---

const siteSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["residential_estate", "office_park"]),
  address: z.string().min(3).max(400),
  dailyTarget: z.coerce.number().int().min(1).max(500),
  operatingHours: z
    .string()
    .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "HH:MM-HH:MM"),
  parkingBays: z.coerce.boolean(),
  powerOutlet: z.coerce.boolean(),
  storageCage: z.coerce.boolean(),
  signagePermission: z.coerce.boolean(),
  lockboxLocation: z.string().max(400).optional(),
});

export async function createSite(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = siteSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address"),
    dailyTarget: formData.get("dailyTarget"),
    operatingHours: formData.get("operatingHours"),
    parkingBays: formData.get("parkingBays") === "on",
    powerOutlet: formData.get("powerOutlet") === "on",
    storageCage: formData.get("storageCage") === "on",
    signagePermission: formData.get("signagePermission") === "on",
    lockboxLocation: formData.get("lockboxLocation") || undefined,
  });
  if (!parsed.success) redirect("/ops/sites?error=invalid");

  const d = parsed.data;
  const [site] = await db
    .insert(sites)
    .values({
      name: d.name,
      type: d.type,
      address: d.address,
      dailyTarget: d.dailyTarget,
      operatingHours: d.operatingHours,
    })
    .returning({ id: sites.id });

  await db.insert(siteRequirements).values({
    siteId: site.id,
    parkingBays: d.parkingBays,
    powerOutlet: d.powerOutlet,
    storageCage: d.storageCage,
    signagePermission: d.signagePermission,
    lockboxLocation: d.lockboxLocation ?? null,
  });

  await log(session.user.id, "site.create", "sites", site.id, null, {
    name: d.name,
    type: d.type,
    dailyTarget: d.dailyTarget,
  });
  revalidatePath("/ops/sites");
  revalidatePath("/ops");
}

const targetSchema = z.object({
  siteId: z.string().uuid(),
  dailyTarget: z.coerce.number().int().min(1).max(500),
});

export async function updateDailyTarget(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = targetSchema.safeParse({
    siteId: formData.get("siteId"),
    dailyTarget: formData.get("dailyTarget"),
  });
  if (!parsed.success) redirect("/ops/sites?error=invalid");

  const [before] = await db
    .select({ dailyTarget: sites.dailyTarget })
    .from(sites)
    .where(eq(sites.id, parsed.data.siteId))
    .limit(1);
  if (!before) redirect("/ops/sites?error=missing");

  await db
    .update(sites)
    .set({ dailyTarget: parsed.data.dailyTarget, updatedAt: new Date() })
    .where(eq(sites.id, parsed.data.siteId));

  await log(
    session.user.id,
    "site.update_target",
    "sites",
    parsed.data.siteId,
    { dailyTarget: before.dailyTarget },
    { dailyTarget: parsed.data.dailyTarget },
  );
  revalidatePath("/ops/sites");
  revalidatePath("/ops");
}

// --- Team provisioning ---

const provisionSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["technician", "site_lead", "developer_partner"]),
  siteId: z.string().uuid().optional(),
  partnerOrgName: z.string().max(200).optional(),
});

export async function provisionAccount(formData: FormData) {
  const session = await requireRole(["ops_admin"]);
  const parsed = provisionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    siteId: formData.get("siteId") || undefined,
    partnerOrgName: formData.get("partnerOrgName") || undefined,
  });
  if (!parsed.success) redirect("/ops/team?error=invalid");

  const d = parsed.data;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, d.email))
    .limit(1);
  if (existing) redirect("/ops/team?error=exists");

  const passwordHash = await bcrypt.hash(d.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: d.name, email: d.email, passwordHash, role: d.role })
    .returning({ id: users.id });

  await db.insert(profiles).values({
    userId: user.id,
    assignedSiteId:
      d.role === "developer_partner" ? null : (d.siteId ?? null),
    partnerOrgName:
      d.role === "developer_partner" ? (d.partnerOrgName ?? null) : null,
  });

  await log(session.user.id, "user.provision", "users", user.id, null, {
    email: d.email,
    role: d.role,
    siteId: d.siteId ?? null,
  });
  revalidatePath("/ops/team");
}
