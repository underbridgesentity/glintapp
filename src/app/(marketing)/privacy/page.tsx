import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy — Glint",
  description:
    "How Glint collects, uses, and protects personal information under POPIA.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Who we are",
    body: [
      "Glint (\"we\") operates vehicle washing services at residential estates and office parks in South Africa, managed through the Glint app at app.glintapp.co.za. This policy explains how we handle personal information under the Protection of Personal Information Act, 2013 (POPIA).",
    ],
  },
  {
    title: "2. What we collect",
    body: [
      "Account: name, email address, phone number, and your role (resident, fleet manager, once-off customer).",
      "Vehicles: make, model, colour, registration plate, notes you add, and photos.",
      "Washes: bookings, schedules, wash status and timeline, quality checklist results, completion photos, and your ratings.",
      "Payments: plan, amounts, and payment status. Card details are captured and processed by PayFast — they never touch our servers. We store PayFast's payment reference and notification data for reconciliation and dispute handling.",
      "Support: messages you send us in the app.",
      "Technical: authentication cookies required to keep you signed in. We do not run third-party advertising or tracking cookies.",
    ],
  },
  {
    title: "3. Why we use it",
    body: [
      "To deliver washes: scheduling, technician queues, notifications, and proof of completion.",
      "To bill you: subscription billing and payment reconciliation through PayFast.",
      "To communicate: transactional email (booking confirmations, wash completion, payment receipts, support replies) sent via our email provider, Resend.",
      "To keep quality up: ratings, escalations, re-washes, and internal audits.",
      "We do not sell personal information, and we do not use it for third-party advertising.",
    ],
  },
  {
    title: "4. Keys and site security",
    body: [
      "Key tags carry coded identifiers only — never names, unit numbers, or plates. Lockbox access uses one-time codes, and every key check-in and check-out is written to an audit log.",
    ],
  },
  {
    title: "5. Who sees your information",
    body: [
      "Technicians see only what a wash needs: vehicle, bay, wash type, and site — not your contact details.",
      "Property partners see aggregated site statistics (wash counts, utilisation, revenue share). They never see individual customers' names, contact details, or plates.",
      "Service providers that process data for us: PayFast (payments), Resend (email), Vercel and Neon (hosting and database, which may store data outside South Africa with appropriate safeguards).",
      "We disclose information where the law requires it.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "Account and wash records are kept while your account is active. Payment and audit records are kept for 5 years to meet financial and legal obligations. When you delete your account, personal information is removed or anonymised except where the law requires retention.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "Passwords are stored hashed, access is role-restricted and enforced server-side, payment notifications are cryptographically verified, and sensitive actions are audit-logged. No system is perfectly secure; if a breach affects you, we notify you and the Information Regulator as POPIA requires.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "Under POPIA you may request access to, correction of, or deletion of your personal information, and object to processing. Most of this you can do directly in the app; for the rest, email support@glintapp.co.za and we respond within a reasonable time.",
      "You may also complain to the Information Regulator (South Africa): inforeg.org.za.",
    ],
  },
  {
    title: "9. Changes",
    body: [
      "We update this policy as the service evolves and announce material changes in the app and by email before they take effect.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-carbon pt-20 text-white">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
          Legal
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-4 text-sm text-steel">
          Effective 9 July 2026. Written for POPIA.
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                {s.title}
              </h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-7 text-mist">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Exercise your rights
            </h2>
            <p className="mt-3 text-sm leading-7 text-mist">
              To access, correct, or delete your personal information, or to
              object to processing, reach the information officer via the{" "}
              <Link href="/contact" className="text-white underline">
                contact page
              </Link>
              . We respond within a reasonable time as POPIA requires. You may
              escalate to the Information Regulator (South Africa) at any
              point.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
