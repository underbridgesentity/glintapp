// Seed: four personas, two sites, technicians, and dated bookings so every
// dashboard renders real data on first run. Run with `npm run seed`.
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const CHECKLIST_POINTS = [
  "Exterior pre-rinse (water-efficient)",
  "Wheel and arch clean",
  "Body wash with reclaim products",
  "Glass exterior",
  "Dry and detail body panels",
  "Door shuts and sills",
  "Mirrors and trim",
  "Tyre dressing",
  "Interior vacuum",
  "Dashboard and console wipe",
  "Interior glass",
  "Door pockets and cupholders",
  "Mats cleaned and replaced",
  "Boot area check",
  "Final walk-around inspection",
];

function daysFrom(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const hash = await bcrypt.hash("glint-demo-2026", 10);
  const now = new Date();

  const insertUser = async (
    email: string,
    name: string,
    role: (typeof schema.roleEnum.enumValues)[number],
    phone?: string
  ) => {
    const [u] = await db
      .insert(schema.users)
      .values({ email, name, role, phone, passwordHash: hash })
      .returning();
    return u;
  };

  // Personas
  const thandi = await insertUser("thandi@example.com", "Thandi Nkosi", "residential_subscriber");
  const sipho = await insertUser("sipho@example.com", "Sipho Dlamini", "residential_subscriber");
  const linda = await insertUser("linda@example.com", "Linda Mokoena", "fleet_manager");
  const david = await insertUser("david@example.com", "David Peterson", "developer_partner");
  const admin = await insertUser("ops@glint.co.za", "Glint Operations", "ops_admin");
  const lead = await insertUser("lead.sandton@glint.co.za", "Bongani Zulu", "site_lead");
  const tech1 = await insertUser("tech1@glint.co.za", "Musa Khumalo", "technician");
  const tech2 = await insertUser("tech2@glint.co.za", "Precious Ndlovu", "technician");
  const tech3 = await insertUser("tech3@glint.co.za", "Thabo Molefe", "technician");

  // Sites
  const [sandton] = await db
    .insert(schema.sites)
    .values({
      name: "Sandton Gate Estate",
      type: "residential_estate",
      address: "Sandton Gate, William Nicol Dr, Sandton",
      developerPartnerId: david.id,
      dailyTarget: 35,
      footprintNotes: "Basement parking, poor signal in P2. Lockbox at concierge.",
    })
    .returning();
  const [rosebank] = await db
    .insert(schema.sites)
    .values({
      name: "Rosebank Link Office Park",
      type: "office_park",
      address: "173 Oxford Rd, Rosebank",
      developerPartnerId: david.id,
      dailyTarget: 40,
      footprintNotes: "Fleet washing on P1. Storage cage beside lift lobby.",
    })
    .returning();

  await db.insert(schema.siteRequirements).values([
    { siteId: sandton.id, parkingBays: true, powerOutlet: true, lockboxLocation: "Concierge desk", storageCage: true, signagePermission: true },
    { siteId: rosebank.id, parkingBays: true, powerOutlet: false, lockboxLocation: "P1 lift lobby", storageCage: true, signagePermission: false },
  ]);

  // Profiles
  await db.insert(schema.profiles).values([
    { userId: thandi.id, homeSiteId: sandton.id },
    { userId: sipho.id, homeSiteId: sandton.id },
    { userId: linda.id, homeSiteId: rosebank.id, companyName: "Oxford Corporate Services" },
    { userId: david.id, partnerOrgName: "Meridian REIT", revenueSharePct: "5" },
    { userId: lead.id, assignedSiteId: sandton.id },
    { userId: tech1.id, assignedSiteId: sandton.id },
    { userId: tech2.id, assignedSiteId: sandton.id },
    { userId: tech3.id, assignedSiteId: rosebank.id },
  ]);

  // Vehicles
  const [bmw] = await db.insert(schema.vehicles).values({ ownerId: thandi.id, make: "BMW", model: "3 Series", colour: "Silver", plate: "TN 32 GP" }).returning();
  const [polo] = await db.insert(schema.vehicles).values({ ownerId: sipho.id, make: "Volkswagen", model: "Polo", colour: "Grey", plate: "SD 27 GP" }).returning();
  const fleet: (typeof bmw)[] = [];
  for (let i = 1; i <= 30; i++) {
    const [v] = await db
      .insert(schema.vehicles)
      .values({
        ownerId: linda.id,
        make: i % 3 === 0 ? "Toyota" : i % 3 === 1 ? "Ford" : "Hyundai",
        model: i % 3 === 0 ? "Corolla" : i % 3 === 1 ? "Ranger" : "i20",
        colour: i % 2 === 0 ? "White" : "Silver",
        plate: `FL ${String(i).padStart(2, "0")} GP`,
      })
      .returning();
    fleet.push(v);
  }

  // Subscriptions
  const [subThandi] = await db.insert(schema.subscriptions).values({ userId: thandi.id, plan: "premium", monthlyAmountCents: 75000, scheduledWashDays: ["tuesday", "friday"], billingAnchorDay: 1 }).returning();
  const [subSipho] = await db.insert(schema.subscriptions).values({ userId: sipho.id, plan: "basic", monthlyAmountCents: 45000, scheduledWashDays: ["wednesday"], billingAnchorDay: 1 }).returning();
  const [subLinda] = await db.insert(schema.subscriptions).values({ userId: linda.id, plan: "fleet", monthlyAmountCents: 35000 * 30, scheduledWashDays: ["monday"], billingAnchorDay: 1 }).returning();

  // Bookings: past completes + today's queue + future
  const bookingRows: (typeof schema.bookings.$inferInsert)[] = [];
  for (let w = 4; w >= 1; w--) {
    bookingRows.push(
      { vehicleId: bmw.id, siteId: sandton.id, subscriptionId: subThandi.id, technicianId: tech1.id, scheduledDate: daysFrom(now, -7 * w), status: "complete", washType: "interior_exterior", completedAt: new Date(now.getTime() - 7 * w * 86400000) },
      { vehicleId: polo.id, siteId: sandton.id, subscriptionId: subSipho.id, technicianId: tech2.id, scheduledDate: daysFrom(now, -7 * w + 1), status: "complete", washType: "exterior", completedAt: new Date(now.getTime() - (7 * w - 1) * 86400000) }
    );
  }
  for (const v of fleet.slice(0, 12)) {
    bookingRows.push({ vehicleId: v.id, siteId: rosebank.id, subscriptionId: subLinda.id, technicianId: tech3.id, scheduledDate: daysFrom(now, -7), status: "complete", washType: "exterior", completedAt: new Date(now.getTime() - 7 * 86400000) });
  }
  // Today
  bookingRows.push(
    { vehicleId: bmw.id, siteId: sandton.id, subscriptionId: subThandi.id, technicianId: tech1.id, scheduledDate: daysFrom(now, 0), status: "in_progress", washType: "interior_exterior", startedAt: now },
    { vehicleId: polo.id, siteId: sandton.id, subscriptionId: subSipho.id, scheduledDate: daysFrom(now, 0), status: "queued", washType: "exterior" }
  );
  for (const v of fleet.slice(0, 8)) {
    bookingRows.push({ vehicleId: v.id, siteId: rosebank.id, subscriptionId: subLinda.id, technicianId: tech3.id, scheduledDate: daysFrom(now, 0), status: "queued", washType: "exterior" });
  }
  // Future
  bookingRows.push(
    { vehicleId: bmw.id, siteId: sandton.id, subscriptionId: subThandi.id, scheduledDate: daysFrom(now, 3), status: "queued", washType: "interior_exterior" },
    { vehicleId: polo.id, siteId: sandton.id, subscriptionId: subSipho.id, scheduledDate: daysFrom(now, 7), status: "queued", washType: "exterior" }
  );
  const inserted = await db.insert(schema.bookings).values(bookingRows).returning();

  const completed = inserted.filter((b) => b.status === "complete");

  // Quality checks + ratings on completed washes; one low rating -> escalation
  for (const [i, b] of completed.entries()) {
    await db.insert(schema.qualityChecks).values({
      bookingId: b.id,
      technicianId: b.technicianId!,
      points: CHECKLIST_POINTS.map((point) => ({ point, pass: true })),
    });
    const isFleet = b.siteId === rosebank.id;
    const score = i === 2 ? 2 : 4 + (i % 2);
    const raterId = isFleet ? linda.id : b.vehicleId === bmw.id ? thandi.id : sipho.id;
    await db.insert(schema.ratings).values({ bookingId: b.id, userId: raterId, score, comment: score < 3 ? "Water marks on the rear glass." : null });
    if (score < 3) {
      await db.insert(schema.escalations).values({ bookingId: b.id, reason: "Rating below 3: water marks on rear glass.", status: "re_wash_scheduled", assignedOpsId: admin.id });
    }
  }

  // Payments
  await db.insert(schema.payments).values([
    { userId: thandi.id, subscriptionId: subThandi.id, type: "subscription_recurring", amountCents: 75000, status: "complete", providerRef: "pf_demo_0001", method: "card" },
    { userId: sipho.id, subscriptionId: subSipho.id, type: "subscription_recurring", amountCents: 45000, status: "complete", providerRef: "pf_demo_0002", method: "card" },
    { userId: linda.id, subscriptionId: subLinda.id, type: "fleet_invoice", amountCents: 35000 * 30, status: "complete", providerRef: "pf_demo_0003", method: "eft" },
  ]);

  // Notifications
  await db.insert(schema.notifications).values([
    { recipientId: thandi.id, template: "wash_done", payload: { vehicle: "Silver BMW 3 Series", time: "11:42" } },
    { recipientId: sipho.id, template: "wash_done", payload: { vehicle: "Grey VW Polo", time: "10:15" } },
    { recipientId: linda.id, template: "fleet_summary", payload: { washed: 12, site: "Rosebank Link Office Park" } },
  ]);

  // Key management for today's interior wash
  const todayInterior = inserted.find((b) => b.status === "in_progress");
  if (todayInterior) {
    await db.insert(schema.keyManagement).values({
      bookingId: todayInterior.id,
      siteId: sandton.id,
      keyTagCode: "SG-014",
      checkedInAt: now,
      checkedInBy: tech1.id,
    });
  }

  // Mystery shopper audit
  await db.insert(schema.mysteryShopperAudits).values({
    siteId: rosebank.id,
    auditorId: admin.id,
    score: 4,
    findings: "Queue handled to schedule. 1 vehicle missed tyre dressing.",
  });

  console.info("Seed complete: 9 users, 2 sites, 32 vehicles, %d bookings.", inserted.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
