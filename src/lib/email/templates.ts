// Branded transactional email templates. Table-based, inline styles for email
// client compatibility. Carbon background, white text, lemon as the single
// accent — matches the Glint app. Voice rules apply: brief, factual, second
// person, no exclamation marks.

type Built = { subject: string; html: string; text: string };

const CARBON = "#0C0C0C";
const CARBON_MID = "#141414";
const BORDER = "#2A2A2A";
const WHITE = "#F8F8F8";
const MIST = "#8C8C8C";
const LEMON = "#CDFF00";

function layout(opts: {
  preheader: string;
  heading: string;
  lines: string[];
  cta?: { label: string; url: string };
  footer?: string;
}): string {
  const { preheader, heading, lines, cta, footer } = opts;
  const body = lines
    .map(
      (l) =>
        `<p style="margin:0 0 14px;color:${MIST};font-size:15px;line-height:1.7;">${l}</p>`
    )
    .join("");
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;margin-top:8px;background:${LEMON};color:${CARBON};text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:100px;">${cta.label}</a>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${CARBON};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARBON};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
    <tr><td style="padding:0 8px 24px;">
      <span style="font-weight:900;letter-spacing:-0.04em;font-size:26px;color:${WHITE};">Glint<span style="color:${LEMON};">.</span></span>
    </td></tr>
    <tr><td style="background:${CARBON_MID};border:1px solid ${BORDER};border-radius:8px;padding:32px;">
      <h1 style="margin:0 0 16px;color:${WHITE};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;">${heading}</h1>
      ${body}
      ${button}
    </td></tr>
    <tr><td style="padding:20px 8px 0;">
      <p style="margin:0;color:${MIST};font-size:12px;line-height:1.6;">${footer ?? "Glint — eco-friendly, water-efficient car care. Johannesburg."}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.glintapp.co.za";
  return `${base}${path}`;
}

type Payload = Record<string, unknown>;

// Map a notification template + payload to a rendered email. Returns null for
// templates that should not email (in-app only).
export function renderEmail(
  template: string,
  payload: Payload,
  name: string
): Built | null {
  const first = name.split(" ")[0];
  switch (template) {
    case "welcome": {
      return {
        subject: "Welcome to Glint",
        html: layout({
          preheader: "Your account is ready. Book your first wash.",
          heading: "Welcome to Glint",
          lines: [
            `${first}, your account is ready.`,
            "Add your car, pick your wash days, and park like you always do. We clean it while you work.",
          ],
          cta: { label: "Book your first wash", url: appUrl("/app/book") },
        }),
        text: `${first}, your account is ready. Book your first wash: ${appUrl("/app/book")}`,
      };
    }
    case "plan_updated": {
      const planLabels: Record<string, string> = {
        basic: "Basic",
        premium: "Premium",
        fleet: "Fleet",
      };
      const plan = planLabels[String(payload.plan ?? "")] ?? "your plan";
      return {
        subject: "Plan updated",
        html: layout({
          preheader: `Your plan is now ${plan}.`,
          heading: "Plan updated",
          lines: [
            `${first}, your plan is now ${plan}.`,
            "The change takes effect on your next billing date.",
          ],
          cta: { label: "View your plan", url: appUrl("/app/plan") },
        }),
        text: `${first}, your plan is now ${plan}. View it: ${appUrl("/app/plan")}`,
      };
    }
    case "escalation_opened": {
      return {
        subject: "We're fixing your last wash",
        html: layout({
          preheader: "We saw your rating. A re-wash is being arranged.",
          heading: "We're on it",
          lines: [
            `${first}, we saw your rating on the last wash.`,
            "Our team is reviewing it and arranging a re-wash. You don't need to do anything.",
          ],
          cta: { label: "See your history", url: appUrl("/app/history") },
        }),
        text: `${first}, we saw your rating and are arranging a re-wash. History: ${appUrl("/app/history")}`,
      };
    }
    case "password_reset": {
      const url = String(payload.resetUrl ?? appUrl("/forgot-password"));
      return {
        subject: "Reset your Glint password",
        html: layout({
          preheader: "Set a new password. The link works once, for 30 minutes.",
          heading: "Reset your password",
          lines: [
            `${first}, someone asked to reset the password for this account.`,
            "The link below works once and expires in 30 minutes. If this wasn't you, ignore this email — your password stays as it is.",
          ],
          cta: { label: "Set a new password", url },
        }),
        text: `${first}, reset your Glint password (valid 30 minutes, single use): ${url}`,
      };
    }
    case "wash_started": {
      const vehicle = String(payload.vehicle ?? "Your car");
      return {
        subject: "Your wash has started",
        html: layout({
          preheader: `${vehicle} is being washed now.`,
          heading: "Your wash has started",
          lines: [
            `${first}, a technician has started on ${vehicle}.`,
            "Track each step live in the app.",
          ],
          cta: { label: "Track your wash", url: appUrl("/app") },
        }),
        text: `${first}, a technician has started on ${vehicle}. Track it: ${appUrl("/app")}`,
      };
    }
    case "re_wash_scheduled": {
      const vehicle = String(payload.vehicle ?? "your car");
      return {
        subject: "We're re-washing your car",
        html: layout({
          preheader: "A re-wash is booked at no charge.",
          heading: "We're making it right",
          lines: [
            `${first}, a re-wash for ${vehicle} is booked at no charge.`,
            "You'll get the usual notification when it's done.",
          ],
          cta: { label: "See your washes", url: appUrl("/app") },
        }),
        text: `${first}, a re-wash for ${vehicle} is booked at no charge.`,
      };
    }
    case "wash_done": {
      const vehicle = String(payload.vehicle ?? "Your car");
      const time = String(payload.time ?? "");
      return {
        subject: "Your car is clean",
        html: layout({
          preheader: `${vehicle} is done${time ? ` at ${time}` : ""}.`,
          heading: "Your car is clean. You weren't there.",
          lines: [
            `${first}, ${vehicle} is done${time ? `. Finished at ${time}` : ""}.`,
            "Proof photos and the full timeline are in the app.",
          ],
          cta: { label: "See the proof", url: appUrl("/app") },
        }),
        text: `${first}, ${vehicle} is done${time ? ` at ${time}` : ""}. Proof photos are in the app: ${appUrl("/app")}`,
      };
    }
    case "payment_received": {
      const cents = Number(payload.amountCents ?? 0);
      const amount = cents
        ? `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`
        : String(payload.amount ?? "");
      return {
        subject: "Payment received",
        html: layout({
          preheader: "We received your payment.",
          heading: "Payment received",
          lines: [
            `${first}, we received your payment${amount ? ` of ${amount}` : ""}.`,
            "Your plan is active. Your next wash runs on schedule.",
          ],
          cta: { label: "View your plan", url: appUrl("/app/plan") },
        }),
        text: `${first}, we received your payment${amount ? ` of ${amount}` : ""}. Your plan is active.`,
      };
    }
    case "booking_queued": {
      const vehicle = String(payload.vehicle ?? "Your car");
      const date = String(payload.date ?? "");
      return {
        subject: "Wash booked",
        html: layout({
          preheader: `${vehicle} is booked${date ? ` for ${date}` : ""}.`,
          heading: "Wash booked",
          lines: [
            `${first}, ${vehicle} is booked${date ? ` for ${date}` : ""}.`,
            "Park in your normal bay. We handle the rest.",
          ],
          cta: { label: "Track your wash", url: appUrl("/app") },
        }),
        text: `${first}, ${vehicle} is booked${date ? ` for ${date}` : ""}. Track it in the app: ${appUrl("/app")}`,
      };
    }
    case "support_reply": {
      return {
        subject: "Reply from Glint",
        html: layout({
          preheader: "You have a new reply from the Glint team.",
          heading: "You have a new reply",
          lines: [
            `${first}, the Glint team replied to your message.`,
            "Read it and reply in the app.",
          ],
          cta: { label: "Open support", url: appUrl("/app/support") },
        }),
        text: `${first}, the Glint team replied. Read it in the app: ${appUrl("/app/support")}`,
      };
    }
    default:
      // Unknown templates stay in-app only.
      return null;
  }
}
