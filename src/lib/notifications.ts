import { db } from "@/db";
import { notifications } from "@/db/schema";

export interface NotificationService {
  send(input: {
    recipientId: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

// v1: every notification is a real DB row, visible in the UI.
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
