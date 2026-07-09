"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { partnerLeads } from "@/db/schema";
import { sendEmail, opsInbox } from "@/lib/email/resend";

const leadSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  sites: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(3000).optional().or(z.literal("")),
});

export async function submitPartnerLeadAction(formData: FormData) {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    sites: formData.get("sites"),
    message: formData.get("message"),
  });
  if (!parsed.success) redirect("/partners?sent=invalid");

  const lead = parsed.data;
  await db.insert(partnerLeads).values({
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone || null,
    sites: lead.sites || null,
    message: lead.message || null,
  });

  // Best-effort heads-up to ops; the DB row is the source of truth.
  await sendEmail({
    to: opsInbox(),
    subject: `Partner enquiry: ${lead.company}`,
    html: `<p>${lead.name} (${lead.email}${lead.phone ? `, ${lead.phone}` : ""}) — ${lead.company}${lead.sites ? `, ${lead.sites} sites` : ""}.</p><p>${lead.message ?? ""}</p>`,
    text: `${lead.name} (${lead.email}${lead.phone ? `, ${lead.phone}` : ""}) — ${lead.company}${lead.sites ? `, ${lead.sites} sites` : ""}. ${lead.message ?? ""}`,
  });

  redirect("/partners?sent=1");
}
