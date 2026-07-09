import "server-only";
import { Resend } from "resend";

// Lazy client — env is read at send time, never at import (keeps builds green
// and lets the app run without email configured).
let client: Resend | null | undefined;

function getClient(): Resend | null {
  if (client === undefined) {
    const key = process.env.RESEND_API_KEY;
    client = key ? new Resend(key) : null;
  }
  return client;
}

// Internal notifications (leads, contact messages) go to a mailbox that can
// actually receive. glintapp.co.za has no inbound mail yet — Resend only
// covers sending — so this must stay a real, monitored address.
export function opsInbox(): string {
  return process.env.OPS_INBOX ?? "joseph@underbridges.co.za";
}

// Send one transactional email. Never throws into the caller — email delivery
// must not break a booking, payment, or wash-completion flow.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
  const from = process.env.EMAIL_FROM ?? "Glint <notifications@glintapp.co.za>";
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error("[email] send failed:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { ok: false, error: String(err) };
  }
}
