import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";

// One logical support thread per customer. These are query helpers; the
// route-level server actions wrap them with requireRole and validation.

export async function getThread(customerId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.customerId, customerId))
    .orderBy(asc(messages.createdAt));
}

export async function insertMessage(input: {
  customerId: string;
  senderId: string;
  senderRole: "customer" | "ops";
  body: string;
  bookingId?: string | null;
}) {
  await db.insert(messages).values({
    customerId: input.customerId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    body: input.body,
    bookingId: input.bookingId ?? null,
  });
}

// Mark every message the other party sent in this thread as read.
export async function markThreadRead(customerId: string, reader: "customer" | "ops") {
  const other = reader === "customer" ? "ops" : "customer";
  await db
    .update(messages)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(messages.customerId, customerId),
        eq(messages.senderRole, other),
        isNull(messages.readAt)
      )
    );
}

// Ops inbox: latest message per customer thread with unread counts.
export async function listThreads() {
  const rows = await db
    .select({
      customerId: messages.customerId,
      customerName: users.name,
      lastBody: sql<string>`(array_agg(${messages.body} ORDER BY ${messages.createdAt} DESC))[1]`,
      lastAt: sql<Date>`max(${messages.createdAt})`,
      unread: sql<number>`count(*) filter (where ${messages.senderRole} = 'customer' and ${messages.readAt} is null)`,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.customerId))
    .groupBy(messages.customerId, users.name)
    .orderBy(desc(sql`max(${messages.createdAt})`));
  return rows;
}
