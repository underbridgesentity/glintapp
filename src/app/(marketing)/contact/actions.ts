"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { sendEmail, opsInbox } from "@/lib/email/resend";

const TOPICS = ["question", "coverage", "press", "other"] as const;

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  topic: z.enum(TOPICS),
  site: z.string().max(160).optional().or(z.literal("")),
  body: z.string().max(3000).optional().or(z.literal("")),
});

export async function submitContactAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    site: formData.get("site"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/contact?sent=invalid");

  const m = parsed.data;
  // Coverage requests need a place; a bare "get Glint here" tells ops nothing.
  if (m.topic === "coverage" && !m.site) redirect("/contact?sent=invalid");

  await db.insert(contactMessages).values({
    name: m.name,
    email: m.email,
    topic: m.topic,
    site: m.site || null,
    body: m.body || null,
  });

  // Best-effort heads-up; the DB row is the source of truth.
  const subject =
    m.topic === "coverage"
      ? `Coverage request: ${m.site}`
      : `Contact (${m.topic}): ${m.name}`;
  await sendEmail({
    to: opsInbox(),
    subject,
    html: `<p><strong>${m.name}</strong> (${m.email}) — ${m.topic}${m.site ? ` — ${m.site}` : ""}</p><p>${m.body ?? ""}</p>`,
    text: `${m.name} (${m.email}) — ${m.topic}${m.site ? ` — ${m.site}` : ""}\n${m.body ?? ""}`,
  });

  redirect("/contact?sent=1");
}
