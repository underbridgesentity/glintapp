"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  auditLog,
  bookings,
  keyManagement,
  qualityChecks,
  vehicles,
} from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { notificationService } from "@/lib/notifications";
import { logWashEvent } from "@/lib/wash-events";
import { assignedSiteFor } from "./data";
import { CHECKLIST_POINTS } from "./checklist";

// Every action: authenticate, resolve the technician's site, and refuse
// anything outside it.
async function fieldContext() {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  if (!site) throw new Error("No site assigned to your profile.");
  return { session, site };
}

async function siteScopedBooking(bookingId: string, siteId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.siteId, siteId)))
    .limit(1);
  if (!booking) throw new Error("Booking not found at your site.");
  return booking;
}

const idSchema = z.object({ bookingId: z.string().uuid() });

export async function claimBookingAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = idSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) throw new Error("Invalid booking.");

  const booking = await siteScopedBooking(parsed.data.bookingId, site.id);
  if (booking.status !== "queued") {
    throw new Error("Booking is no longer in the queue.");
  }

  await db
    .update(bookings)
    .set({
      technicianId: session.user.id,
      status: "in_progress",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await logWashEvent({
    bookingId: booking.id,
    kind: "claimed",
    note: `Claimed by ${session.user.name ?? "a technician"}`,
    actorId: session.user.id,
  });
  await logWashEvent({
    bookingId: booking.id,
    kind: "in_progress",
    actorId: session.user.id,
  });

  revalidatePath("/tech");
  redirect(`/tech/wash/${booking.id}`);
}

export async function markArrivedAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = idSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) throw new Error("Invalid booking.");

  const booking = await siteScopedBooking(parsed.data.bookingId, site.id);
  if (booking.status !== "in_progress") {
    throw new Error("Booking is not in progress.");
  }
  if (
    booking.technicianId !== session.user.id &&
    session.user.role !== "site_lead"
  ) {
    throw new Error("Only the claiming technician or a site lead can mark arrival.");
  }

  // Timeline-only: the booking record is unchanged.
  await logWashEvent({
    bookingId: booking.id,
    kind: "arrived",
    note: "On site",
    actorId: session.user.id,
  });

  revalidatePath(`/tech/wash/${booking.id}`);
}

const checklistSchema = z.object({
  bookingId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  passes: z.array(z.boolean()).length(CHECKLIST_POINTS.length),
});

export async function saveChecklistAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = checklistSchema.safeParse({
    bookingId: formData.get("bookingId"),
    notes: (formData.get("notes") as string) || undefined,
    passes: CHECKLIST_POINTS.map((_, i) => formData.get(`point-${i}`) === "on"),
  });
  if (!parsed.success) throw new Error("Invalid checklist submission.");

  const booking = await siteScopedBooking(parsed.data.bookingId, site.id);
  if (
    booking.technicianId !== session.user.id &&
    session.user.role !== "site_lead"
  ) {
    throw new Error("Only the claiming technician or a site lead can record checks.");
  }

  const points = CHECKLIST_POINTS.map((point, i) => ({
    point,
    pass: parsed.data.passes[i],
  }));

  const [existing] = await db
    .select({ id: qualityChecks.id })
    .from(qualityChecks)
    .where(eq(qualityChecks.bookingId, booking.id))
    .limit(1);

  if (existing) {
    await db
      .update(qualityChecks)
      .set({
        points,
        notes: parsed.data.notes ?? null,
        technicianId: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(qualityChecks.id, existing.id));
  } else {
    await db.insert(qualityChecks).values({
      bookingId: booking.id,
      technicianId: session.user.id,
      points,
      notes: parsed.data.notes ?? null,
    });
  }

  const passed = points.filter((p) => p.pass).length;
  await logWashEvent({
    bookingId: booking.id,
    kind: "checklist_progress",
    progress: passed,
    actorId: session.user.id,
  });

  revalidatePath(`/tech/wash/${booking.id}`);
}

const markDoneSchema = z.object({
  bookingId: z.string().uuid(),
  photoUrls: z.array(z.string().url()).max(10),
});

export async function markDoneAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = markDoneSchema.safeParse({
    bookingId: formData.get("bookingId"),
    photoUrls: String(formData.get("photoUrls") ?? "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) throw new Error("Check the photo URLs and try again.");

  const booking = await siteScopedBooking(parsed.data.bookingId, site.id);
  if (booking.status !== "in_progress") {
    throw new Error("Booking is not in progress.");
  }
  if (
    booking.technicianId !== session.user.id &&
    session.user.role !== "site_lead"
  ) {
    throw new Error("Only the claiming technician or a site lead can complete this wash.");
  }

  const [check] = await db
    .select({ id: qualityChecks.id })
    .from(qualityChecks)
    .where(eq(qualityChecks.bookingId, booking.id))
    .limit(1);
  if (!check) throw new Error("Save the 15-point checklist before marking done.");

  const completedAt = new Date();
  await db
    .update(bookings)
    .set({
      status: "complete",
      completedAt,
      completionPhotoUrls: parsed.data.photoUrls,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await db.insert(auditLog).values({
    actorId: session.user.id,
    action: "booking.complete",
    entity: "bookings",
    entityId: booking.id,
    before: { status: booking.status },
    after: { status: "complete", completedAt: completedAt.toISOString() },
  });

  if (parsed.data.photoUrls.length > 0) {
    await logWashEvent({
      bookingId: booking.id,
      kind: "photos_uploaded",
      note: `${parsed.data.photoUrls.length} proof photos`,
      actorId: session.user.id,
    });
  }
  await logWashEvent({
    bookingId: booking.id,
    kind: "complete",
    actorId: session.user.id,
  });

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, booking.vehicleId))
    .limit(1);
  if (vehicle) {
    await notificationService.send({
      recipientId: vehicle.ownerId,
      template: "wash_done",
      payload: {
        vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.plate})`,
        time: completedAt.toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Johannesburg",
        }),
      },
    });
  }

  revalidatePath("/tech");
  redirect("/tech");
}

const keySchema = z.object({ keyId: z.string().uuid() });

async function siteScopedKey(keyId: string, siteId: string) {
  const [key] = await db
    .select()
    .from(keyManagement)
    .where(and(eq(keyManagement.id, keyId), eq(keyManagement.siteId, siteId)))
    .limit(1);
  if (!key) throw new Error("Key record not found at your site.");
  return key;
}

export async function keyCheckInAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = keySchema.safeParse({ keyId: formData.get("keyId") });
  if (!parsed.success) throw new Error("Invalid key record.");

  const key = await siteScopedKey(parsed.data.keyId, site.id);
  const now = new Date();
  await db
    .update(keyManagement)
    .set({ checkedInAt: now, checkedInBy: session.user.id, updatedAt: now })
    .where(eq(keyManagement.id, key.id));

  await db.insert(auditLog).values({
    actorId: session.user.id,
    action: "key.check_in",
    entity: "key_management",
    entityId: key.id,
    after: { keyTagCode: key.keyTagCode, checkedInAt: now.toISOString() },
  });

  revalidatePath("/tech/keys");
}

export async function keyCheckOutAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = keySchema.safeParse({ keyId: formData.get("keyId") });
  if (!parsed.success) throw new Error("Invalid key record.");

  const key = await siteScopedKey(parsed.data.keyId, site.id);
  const now = new Date();
  await db
    .update(keyManagement)
    .set({ checkedOutAt: now, checkedOutBy: session.user.id, updatedAt: now })
    .where(eq(keyManagement.id, key.id));

  await db.insert(auditLog).values({
    actorId: session.user.id,
    action: "key.check_out",
    entity: "key_management",
    entityId: key.id,
    after: { keyTagCode: key.keyTagCode, checkedOutAt: now.toISOString() },
  });

  revalidatePath("/tech/keys");
}

export async function generateOtpAction(formData: FormData) {
  const { session, site } = await fieldContext();
  const parsed = keySchema.safeParse({ keyId: formData.get("keyId") });
  if (!parsed.success) throw new Error("Invalid key record.");

  const key = await siteScopedKey(parsed.data.keyId, site.id);
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  // Persist only a hash — the plaintext code is never stored, so a DB read
  // cannot recover past lockbox codes. The event log proves it was issued.
  const event = {
    otpHash: createHash("sha256").update(otp).digest("hex"),
    generatedAt: new Date().toISOString(),
    by: session.user.id,
  };
  const events = Array.isArray(key.otpEvents)
    ? [...(key.otpEvents as unknown[]), event]
    : [event];

  await db
    .update(keyManagement)
    .set({ otpEvents: events, updatedAt: new Date() })
    .where(eq(keyManagement.id, key.id));

  await db.insert(auditLog).values({
    actorId: session.user.id,
    action: "key.otp_generated",
    entity: "key_management",
    entityId: key.id,
    after: { keyTagCode: key.keyTagCode, generatedAt: event.generatedAt },
  });

  // Deliver the code via a short-lived httpOnly cookie, never the URL — URLs
  // land in access logs and history. The cookie is read once by the keys page
  // and expires in 2 minutes.
  const jar = await cookies();
  jar.set("glint_otp_flash", `${otp}:${key.keyTagCode}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: "/tech",
  });

  revalidatePath("/tech/keys");
  redirect("/tech/keys");
}
