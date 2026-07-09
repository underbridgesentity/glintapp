"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  vehicles,
  bookings,
  subscriptions,
  ratings,
  escalations,
  notifications,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { notificationService } from "@/lib/notifications";
import { insertMessage } from "@/lib/support";
import { PLAN_PRICING } from "./pricing";

async function ownedVehicle(vehicleId: string, userId: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.ownerId, userId),
        isNull(vehicles.deletedAt)
      )
    )
    .limit(1);
  return vehicle;
}

// --- Notifications ---

const markReadSchema = z.object({ notificationId: z.string().uuid() });

export async function markNotificationReadAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = markReadSchema.safeParse({
    notificationId: formData.get("notificationId"),
  });
  if (!parsed.success) return;

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, parsed.data.notificationId),
        eq(notifications.recipientId, session.user.id)
      )
    );
  revalidatePath("/app");
}

// --- Vehicles ---

const addVehicleSchema = z.object({
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  colour: z.string().min(1).max(40),
  plate: z.string().min(1).max(20),
  notes: z.string().max(500).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export async function addVehicleAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = addVehicleSchema.safeParse({
    make: formData.get("make"),
    model: formData.get("model"),
    colour: formData.get("colour"),
    plate: formData.get("plate"),
    notes: formData.get("notes") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
  });
  if (!parsed.success) redirect("/app/vehicles?error=invalid");

  const { make, model, colour, plate, notes, photoUrl } = parsed.data;
  await db.insert(vehicles).values({
    ownerId: session.user.id,
    make,
    model,
    colour,
    plate,
    notes: notes ?? null,
    photoUrls: photoUrl ? [photoUrl] : [],
  });
  revalidatePath("/app/vehicles");
  redirect("/app/vehicles");
}

const removeVehicleSchema = z.object({ vehicleId: z.string().uuid() });

export async function removeVehicleAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = removeVehicleSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
  });
  if (!parsed.success) return;

  const vehicle = await ownedVehicle(parsed.data.vehicleId, session.user.id);
  if (!vehicle) return;

  await db
    .update(vehicles)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(vehicles.id, vehicle.id));
  revalidatePath("/app/vehicles");
}

// --- Bookings ---

const bookWashSchema = z.object({
  vehicleId: z.string().uuid(),
  siteId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  washType: z.enum(["exterior", "interior_exterior"]),
});

export async function bookWashAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = bookWashSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    siteId: formData.get("siteId"),
    scheduledDate: formData.get("scheduledDate"),
    washType: formData.get("washType"),
  });
  if (!parsed.success) redirect("/app/book?error=invalid");

  const vehicle = await ownedVehicle(parsed.data.vehicleId, session.user.id);
  if (!vehicle) redirect("/app/book?error=invalid");

  const [subscription] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.status, "active"),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);

  const [booking] = await db
    .insert(bookings)
    .values({
      vehicleId: parsed.data.vehicleId,
      siteId: parsed.data.siteId,
      subscriptionId: subscription?.id ?? null,
      scheduledDate: parsed.data.scheduledDate,
      washType: parsed.data.washType,
      status: "queued",
    })
    .returning();

  await notificationService.send({
    recipientId: session.user.id,
    template: "booking_queued",
    payload: {
      bookingId: booking.id,
      vehicle: `${vehicle.colour} ${vehicle.make} ${vehicle.model}`,
      date: parsed.data.scheduledDate,
    },
  });

  revalidatePath("/app");
  redirect("/app");
}

// --- Scheduled wash days ---

const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

const scheduleSchema = z.object({
  days: z.array(z.enum(VALID_DAYS)).max(5),
});

export async function updateScheduleAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = scheduleSchema.safeParse({
    days: formData.getAll("days"),
  });
  if (!parsed.success) redirect("/app/schedule?error=invalid");

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);
  if (!subscription) redirect("/app/plan");

  await db
    .update(subscriptions)
    .set({ scheduledWashDays: parsed.data.days, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscription.id));

  revalidatePath("/app/schedule");
  redirect("/app/schedule?saved=1");
}

// --- Ratings ---

const rateSchema = z.object({
  bookingId: z.string().uuid(),
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function rateWashAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = rateSchema.safeParse({
    bookingId: formData.get("bookingId"),
    score: formData.get("score"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) redirect("/app/history?error=invalid");

  // Ownership: booking's vehicle must belong to this user.
  const [row] = await db
    .select({ booking: bookings, vehicle: vehicles })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(
      and(
        eq(bookings.id, parsed.data.bookingId),
        eq(vehicles.ownerId, session.user.id),
        eq(bookings.status, "complete")
      )
    )
    .limit(1);
  if (!row) redirect("/app/history?error=invalid");

  const [existing] = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(eq(ratings.bookingId, parsed.data.bookingId))
    .limit(1);
  if (existing) redirect("/app/history");

  await db.insert(ratings).values({
    bookingId: parsed.data.bookingId,
    userId: session.user.id,
    score: parsed.data.score,
    comment: parsed.data.comment ?? null,
  });

  if (parsed.data.score < 3) {
    const [escalation] = await db
      .insert(escalations)
      .values({
        bookingId: parsed.data.bookingId,
        reason:
          parsed.data.comment?.trim() ||
          `Customer rated wash ${parsed.data.score} of 5.`,
      })
      .returning();

    await db.insert(auditLog).values({
      actorId: session.user.id,
      action: "escalation.auto_created",
      entity: "escalations",
      entityId: escalation.id,
      after: { bookingId: parsed.data.bookingId, score: parsed.data.score },
    });

    await notificationService.send({
      recipientId: session.user.id,
      template: "escalation_opened",
      payload: { bookingId: parsed.data.bookingId },
    });
  }

  revalidatePath("/app/history");
  redirect("/app/history");
}

// --- Plan ---

const planSchema = z.object({
  plan: z.enum(["basic", "premium", "fleet"]),
});

export async function selectPlanAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = planSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) redirect("/app/plan?error=invalid");

  // Fleet plan is for fleet managers; others pick basic or premium.
  if (parsed.data.plan === "fleet" && session.user.role !== "fleet_manager") {
    redirect("/app/plan?error=invalid");
  }

  const monthlyAmountCents = PLAN_PRICING[parsed.data.plan];

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);

  let subscriptionId: string;
  if (existing) {
    await db
      .update(subscriptions)
      .set({
        plan: parsed.data.plan,
        monthlyAmountCents,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing.id));
    subscriptionId = existing.id;
  } else {
    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: session.user.id,
        plan: parsed.data.plan,
        monthlyAmountCents,
        status: "active",
      })
      .returning();
    subscriptionId = created.id;
  }

  await db.insert(auditLog).values({
    actorId: session.user.id,
    action: existing ? "subscription.plan_changed" : "subscription.created",
    entity: "subscriptions",
    entityId: subscriptionId,
    before: existing
      ? { plan: existing.plan, monthlyAmountCents: existing.monthlyAmountCents }
      : null,
    after: { plan: parsed.data.plan, monthlyAmountCents },
  });

  await notificationService.send({
    recipientId: session.user.id,
    template: "plan_updated",
    payload: { plan: parsed.data.plan, monthlyAmountCents },
  });

  revalidatePath("/app/plan");
  redirect("/app/plan?saved=1");
}

// --- Support (human chat, DB-logged, no AI) ---

const supportMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function sendSupportMessageAction(formData: FormData) {
  const session = await requireRole(CUSTOMER_ROLES);
  const parsed = supportMessageSchema.safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success) return;

  await insertMessage({
    customerId: session.user.id,
    senderId: session.user.id,
    senderRole: "customer",
    body: parsed.data.body,
  });

  revalidatePath("/app/support");
}
