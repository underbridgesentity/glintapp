// Glint schema. Every change ships as a checked-in Drizzle migration;
// never push ad-hoc to production.
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "residential_subscriber",
  "fleet_manager",
  "once_off",
  "technician",
  "site_lead",
  "ops_admin",
  "developer_partner",
]);

export const siteTypeEnum = pgEnum("site_type", [
  "residential_estate",
  "office_park",
]);

export const planEnum = pgEnum("plan", ["basic", "premium", "fleet"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "paused",
  "cancelled",
]);

export const washStatusEnum = pgEnum("wash_status", [
  "queued",
  "in_progress",
  "complete",
  "re_wash",
  "cancelled",
]);

export const washTypeEnum = pgEnum("wash_type", [
  "exterior",
  "interior_exterior",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription_recurring",
  "once_off",
  "fleet_invoice",
  "developer_reconciliation",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "complete",
  "failed",
  "refunded",
]);

export const escalationStatusEnum = pgEnum("escalation_status", [
  "open",
  "investigating",
  "re_wash_scheduled",
  "resolved",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

// Granular wash timeline — powers the customer live tracker.
export const washEventKindEnum = pgEnum("wash_event_kind", [
  "booked",
  "queued",
  "claimed",
  "arrived",
  "in_progress",
  "checklist_progress",
  "photos_uploaded",
  "complete",
  "re_wash",
]);

// Human support chat (no AI). Customer <-> ops, optionally about a wash.
export const messageSenderRoleEnum = pgEnum("message_sender_role", [
  "customer",
  "ops",
]);

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

const softDelete = {
  deletedAt: timestamp("deleted_at"),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("residential_subscriber"),
  notificationPrefs: jsonb("notification_prefs")
    .notNull()
    .default({ washDone: true, washStarted: false, billing: true }),
  ...timestamps,
  ...softDelete,
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  // Role-specific extended fields (company name, employer site,
  // partner org, technician assignment).
  companyName: text("company_name"),
  homeSiteId: uuid("home_site_id"),
  assignedSiteId: uuid("assigned_site_id"),
  partnerOrgName: text("partner_org_name"),
  revenueSharePct: numeric("revenue_share_pct"),
  ...timestamps,
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: siteTypeEnum("type").notNull(),
  address: text("address").notNull(),
  lat: numeric("lat"),
  lng: numeric("lng"),
  developerPartnerId: uuid("developer_partner_id").references(() => users.id),
  dailyTarget: integer("daily_target").notNull().default(35),
  operatingHours: text("operating_hours").notNull().default("09:00-15:00"),
  footprintNotes: text("footprint_notes"),
  ...timestamps,
  ...softDelete,
});

export const siteRequirements = pgTable("site_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  parkingBays: boolean("parking_bays").notNull().default(false),
  powerOutlet: boolean("power_outlet").notNull().default(false),
  lockboxLocation: text("lockbox_location"),
  storageCage: boolean("storage_cage").notNull().default(false),
  signagePermission: boolean("signage_permission").notNull().default(false),
  ...timestamps,
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  colour: text("colour").notNull(),
  plate: text("plate").notNull(),
  notes: text("notes"),
  photoUrls: jsonb("photo_urls").notNull().default([]),
  ...timestamps,
  ...softDelete,
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  plan: planEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  monthlyAmountCents: integer("monthly_amount_cents").notNull(),
  billingAnchorDay: integer("billing_anchor_day").notNull().default(1),
  scheduledWashDays: jsonb("scheduled_wash_days").notNull().default([]),
  payfastToken: text("payfast_token"),
  ...timestamps,
  ...softDelete,
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  technicianId: uuid("technician_id").references(() => users.id),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledWindow: text("scheduled_window").notNull().default("09:00-15:00"),
  status: washStatusEnum("status").notNull().default("queued"),
  washType: washTypeEnum("wash_type").notNull().default("exterior"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  completionPhotoUrls: jsonb("completion_photo_urls").notNull().default([]),
  ...timestamps,
  ...softDelete,
});

export const qualityChecks = pgTable("quality_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  technicianId: uuid("technician_id")
    .notNull()
    .references(() => users.id),
  // 15-point checklist: [{ point: string, pass: boolean }]
  points: jsonb("points").notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  score: integer("score").notNull(),
  comment: text("comment"),
  ...timestamps,
});

export const escalations = pgTable("escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  reason: text("reason").notNull(),
  status: escalationStatusEnum("status").notNull().default("open"),
  assignedOpsId: uuid("assigned_ops_id").references(() => users.id),
  resolution: text("resolution"),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  bookingId: uuid("booking_id").references(() => bookings.id),
  type: paymentTypeEnum("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull().default("payfast"),
  providerRef: text("provider_ref"),
  method: text("method"),
  rawItnPayload: jsonb("raw_itn_payload"),
  ...timestamps,
});

// Append-only: every ITN received, valid or not, for replay/dispute tracing.
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").references(() => payments.id),
  pfPaymentId: text("pf_payment_id"),
  signatureValid: boolean("signature_valid").notNull(),
  hostValid: boolean("host_valid").notNull(),
  amountMatched: boolean("amount_matched").notNull(),
  outcome: text("outcome").notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id),
  channel: text("channel").notNull().default("db"),
  template: text("template").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: notificationStatusEnum("status").notNull().default("sent"),
  readAt: timestamp("read_at"),
  ...timestamps,
});

// Key tags carry codes only — never personal info.
export const keyManagement = pgTable("key_management", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  keyTagCode: text("key_tag_code").notNull(),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: uuid("checked_in_by").references(() => users.id),
  checkedOutAt: timestamp("checked_out_at"),
  checkedOutBy: uuid("checked_out_by").references(() => users.id),
  otpEvents: jsonb("otp_events").notNull().default([]),
  ...timestamps,
});

export const mysteryShopperAudits = pgTable("mystery_shopper_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  bookingId: uuid("booking_id").references(() => bookings.id),
  auditorId: uuid("auditor_id")
    .notNull()
    .references(() => users.id),
  score: integer("score").notNull(),
  findings: text("findings").notNull(),
  ...timestamps,
});

// Append-only wash timeline. Each meaningful step writes one row so the
// customer can see where the wash is and how it's going.
export const washEvents = pgTable("wash_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  kind: washEventKindEnum("kind").notNull(),
  note: text("note"),
  progress: integer("progress"), // 0-15 checklist points, when relevant
  actorId: uuid("actor_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Support conversation. One logical thread per customer; ops replies in it.
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => users.id),
  bookingId: uuid("booking_id").references(() => bookings.id),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id),
  senderRole: messageSenderRoleEnum("sender_role").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at"),
  ...timestamps,
});

// Inbound partner enquiries from the public marketing site.
export const partnerLeads = pgTable("partner_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  sites: text("sites"),
  message: text("message"),
  ...timestamps,
});

// Inbound messages from the public contact page. topic routes triage:
// "coverage" rows are demand capture (where to launch next).
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(), // question | coverage | press | other
  site: text("site"), // estate/office park name for coverage requests
  body: text("body"),
  ...timestamps,
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
