import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { sendEmail } from "@/lib/email/resend";
import { renderEmail } from "@/lib/email/templates";

export interface NotificationService {
  send(input: {
    recipientId: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

// Maps a template to the notificationPrefs key that governs its email.
// null means "always email" (user-initiated confirmations, support replies).
function emailPrefKey(template: string): string | null {
  switch (template) {
    case "wash_done":
      return "washDone";
    case "payment_received":
    case "fleet_summary":
      return "billing";
    default:
      return null;
  }
}

// v1 notifier: always writes a DB row (the in-app feed) and additionally sends
// a branded email via Resend when the recipient has an address and hasn't
// opted out. Email failures never propagate — the DB row is the source of
// truth and delivery is best-effort.
export class DbNotificationService implements NotificationService {
  async send(input: {
    recipientId: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await db.insert(notifications).values({
      recipientId: input.recipientId,
      channel: "db",
      template: input.template,
      payload: input.payload,
      status: "sent",
    });

    try {
      const [user] = await db
        .select({
          email: users.email,
          name: users.name,
          prefs: users.notificationPrefs,
        })
        .from(users)
        .where(eq(users.id, input.recipientId))
        .limit(1);
      if (!user?.email) return;

      const prefKey = emailPrefKey(input.template);
      const prefs = (user.prefs ?? {}) as Record<string, boolean>;
      if (prefKey && prefs[prefKey] === false) return;

      const email = renderEmail(input.template, input.payload, user.name);
      if (!email) return;

      await sendEmail({ to: user.email, ...email });
    } catch (err) {
      console.error("[notifications] email step failed:", err);
    }
  }
}

// Seam for the later WhatsApp integration. Deliberately un-wired in v1:
// constructing it throws so it cannot ship by accident.
export class TwilioWhatsAppProvider implements NotificationService {
  constructor() {
    throw new Error("TwilioWhatsAppProvider is not wired in v1.");
  }
  async send(): Promise<void> {
    throw new Error("TwilioWhatsAppProvider is not wired in v1.");
  }
}

export const notificationService: NotificationService =
  new DbNotificationService();
