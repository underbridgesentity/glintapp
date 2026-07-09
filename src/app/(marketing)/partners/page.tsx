import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { Icon, type IconName } from "@/components/icons";
import { submitPartnerLeadAction } from "./actions";

export const metadata: Metadata = {
  title: "Partners — Glint",
  description:
    "Bring Glint to your estate or office park. Co-branded amenity, monthly reconciliation, revenue share on portfolio deals.",
};

const VALUE: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "building",
    title: "An amenity, not a tenant",
    body: "Glint runs on your site with its own equipment, power plan, and secure lockbox. Your team does nothing on wash days.",
  },
  {
    icon: "gauge",
    title: "A dashboard, not a report",
    body: "Partners see usage at their sites live: washes this month, active subscribers, utilisation against target.",
  },
  {
    icon: "wallet",
    title: "Revenue share on portfolios",
    body: "10 or more sites earns a 5% revenue share, reconciled monthly with a statement you can hand to finance.",
  },
  {
    icon: "shield",
    title: "Security handled",
    body: "Coded key tags, OTP-secured lockboxes, and an audit log on every key movement. No customer names on tags.",
  },
];

const STEPS = [
  "Site walk-through: parking bays, power, lockbox placement, signage.",
  "We provision the site, targets, and technicians in the platform.",
  "Residents subscribe in the app. Washes start within 2 weeks.",
];

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main className="bg-carbon pt-20 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/site-dusk.jpg"
          alt="A modern South African office park at dusk"
          fill
          priority
          className="object-cover opacity-35"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(to top, var(--carbon), transparent)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
            For estates and office parks
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            The amenity your residents use every week.
          </h1>
          <p className="mt-6 max-w-xl text-mist">
            Glint turns parked cars into a service your site offers. No water
            runoff, no queues, no noise — and a revenue share on portfolio
            deals.
          </p>
        </div>
      </section>

      {/* Value grid */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUE.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1} className="surface-1 lift rounded-card p-8">
              <span className="icon-chip icon-chip-lemon">
                <Icon name={v.icon} size={18} />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
                {v.title}
              </h2>
              <p className="mt-3 text-sm text-mist">{v.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Onboarding steps */}
      <section className="border-y border-carbon-border bg-carbon-mid/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Live in 2 weeks
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s} delay={i * 0.12} as="li" className="surface-1 relative overflow-hidden rounded-card p-6">
                <span aria-hidden className="ghost-numeral">{`0${i + 1}`}</span>
                <p className="relative text-sm text-mist">{s}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="mx-auto max-w-6xl px-6 py-20" id="enquire">
        <div className="mx-auto max-w-2xl">
          {sent === "1" ? (
            <div className="surface-2 halo rounded-card p-10 text-center">
              <span className="icon-chip icon-chip-lemon mx-auto">
                <Icon name="checkCircle" size={18} />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
                Enquiry received
              </h2>
              <p className="mt-3 text-mist">
                We reply within 1 business day. Your site walk-through can
                happen this week.
              </p>
            </div>
          ) : (
            <div className="surface-2 rounded-card p-8 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-[-0.025em]">
                Partner with Glint
              </h2>
              <p className="mt-2 text-sm text-mist">
                Tell us about your site. We reply within 1 business day.
              </p>
              {sent === "invalid" ? (
                <p className="surface-well mt-4 rounded-card px-4 py-3 text-sm text-white">
                  Check your details and try again. Name, company, and a valid
                  email are required.
                </p>
              ) : null}
              <form action={submitPartnerLeadAction} className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Your name
                  </span>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Company or body corporate
                  </span>
                  <input
                    name="company"
                    required
                    autoComplete="organization"
                    className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Work email
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Phone (optional)
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Number of sites
                  </span>
                  <input
                    name="sites"
                    placeholder="e.g. 3"
                    className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white placeholder:text-steel"
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                    Anything we should know (optional)
                  </span>
                  <textarea
                    name="message"
                    rows={4}
                    maxLength={3000}
                    className="resize-none rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  />
                </label>
                <button
                  type="submit"
                  className="btn-primary px-8 py-4 sm:col-span-2"
                >
                  Send enquiry
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
