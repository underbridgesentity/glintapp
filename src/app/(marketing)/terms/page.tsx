import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service — Glint",
  description: "The terms that govern Glint subscriptions, washes, and the app.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. The service",
    body: [
      "Glint provides vehicle washing and interior cleaning at participating residential estates and office parks in South Africa, booked and managed through the Glint app. Washes use eco-friendly, water-efficient methods and reclaim products.",
      "Glint operates only at sites where the property owner or body corporate has authorised the service. If your site leaves the programme, we tell you and stop billing at the end of your paid period.",
    ],
  },
  {
    title: "2. Accounts",
    body: [
      "You need an account to book washes. Keep your sign-in details private; actions taken through your account are treated as yours. You must be 18 or older and provide accurate information.",
    ],
  },
  {
    title: "3. Subscriptions and billing",
    body: [
      "Plans bill monthly in advance through PayFast: Basic R450, Premium R750, and Fleet at R350 per vehicle. Once-off washes are charged per wash.",
      "A payment counts as received only when PayFast confirms it to us directly. If a recurring payment fails, we retry and notify you; unpaid plans pause until payment clears.",
      "Prices can change with 30 days' notice in the app and by email. Changes never apply mid-billing-cycle.",
    ],
  },
  {
    title: "4. Cancellation",
    body: [
      "Cancel anytime in the app. Cancellation takes effect at the end of the billing month you have already paid for; washes scheduled in that period still happen.",
    ],
  },
  {
    title: "5. Washes, scheduling, and quality",
    body: [
      "Washes run during site operating hours, typically 09:00 to 15:00 on your scheduled days. Weather, site access, and vehicle accessibility can move a wash; we notify you and reschedule.",
      "Every wash is completed against a 15-point checklist with proof photos in the app. If you rate a wash below 3 out of 5, we open an investigation and schedule a re-wash at no charge.",
    ],
  },
  {
    title: "6. Keys and vehicle access",
    body: [
      "Exterior washes never require keys. Interior cleans use coded key tags and OTP-secured lockboxes; tags never carry personal information, and every key movement is logged.",
      "You confirm the vehicle you register is yours or that you are authorised to have it cleaned.",
    ],
  },
  {
    title: "7. Liability",
    body: [
      "We take real care with your vehicle: trained technicians, a quality checklist, photographic proof, and audited key handling. If we damage your vehicle, report it in the app within 48 hours with photos; we investigate against the wash record and technician log and make good on verified claims.",
      "To the extent the law allows, Glint is not liable for pre-existing damage, items left in vehicles during interior cleans, or indirect and consequential loss. Nothing in these terms limits liability that cannot be limited under South African law, including the Consumer Protection Act.",
    ],
  },
  {
    title: "8. Acceptable use",
    body: [
      "Do not misuse the app, attempt to access other customers' data, or interfere with technicians and site equipment. We may suspend accounts that do, after warning where reasonable.",
    ],
  },
  {
    title: "9. Changes to these terms",
    body: [
      "We update these terms as the service evolves. Material changes are announced in the app and by email at least 14 days before they take effect. Continuing to use Glint after that date accepts the updated terms.",
    ],
  },
  {
    title: "10. Contact and law",
    body: [
      "These terms are governed by South African law. Questions and disputes: support@glintapp.co.za. We aim to resolve complaints within 5 business days.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-carbon pt-20 text-white">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
          Legal
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Terms of service
        </h1>
        <p className="mt-4 text-sm text-steel">Effective 9 July 2026.</p>

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
        </div>
      </section>
    </main>
  );
}
