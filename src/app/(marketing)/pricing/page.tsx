import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Pricing — Glint",
  description:
    "Basic R450, Premium R750, Fleet R350 per vehicle per month. One number, no surprises. Cancel anytime.",
};

const PLANS = [
  {
    name: "Basic",
    price: "R450",
    per: "per month",
    featured: false,
    blurb: "For one car that lives outside.",
    features: [
      "4 exterior washes a month",
      "Scheduled wash days you choose",
      "Live tracking with proof photos",
      "Wash history and ratings",
      "Cancel anytime",
    ],
  },
  {
    name: "Premium",
    price: "R750",
    per: "per month",
    featured: true,
    blurb: "The full clean, inside and out.",
    features: [
      "8 washes a month, interior and exterior",
      "Priority scheduling, 2 days a week",
      "Key-safe lockbox handling with OTP",
      "Live tracking with proof photos",
      "Cancel anytime",
    ],
  },
  {
    name: "Fleet",
    price: "R350",
    per: "per vehicle / month",
    featured: false,
    blurb: "For 2+ vehicles under one invoice.",
    features: [
      "Weekly on-site washes",
      "One consolidated invoice",
      "Per-vehicle status dashboard",
      "Fleet manager reporting",
      "Volume pricing from 10 vehicles",
    ],
  },
];

const FAQ = [
  {
    q: "Do I need to be there?",
    a: "No. Park in your normal bay. For exterior washes we never need your keys; for interior cleans, drop your key at the coded lockbox and the app handles the rest.",
  },
  {
    q: "How do payments work?",
    a: "Subscriptions bill monthly through PayFast. Once-off washes are R180, paid per wash. Your payment is only confirmed when PayFast notifies us directly.",
  },
  {
    q: "What if I'm not happy with a wash?",
    a: "Rate it in the app. Any rating below 3 opens an escalation and schedules a re-wash automatically.",
  },
  {
    q: "Is Glint waterless?",
    a: "No — Glint uses water, efficiently. Reclaim products and controlled application deliver a full clean without the runoff of a driveway wash.",
  },
  {
    q: "Which sites do you operate at?",
    a: "Office parks and residential estates across Johannesburg, with new sites added by partner request. Ask your estate or building manager, or send them our partners page.",
  },
  {
    q: "Can I cancel?",
    a: "Anytime, in the app, effective at the end of your billing month. No calls, no forms.",
  },
];

export default function PricingPage() {
  return (
    <main className="bg-carbon pt-20 text-white">
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
          Pricing
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
          One number. No surprises.
        </h1>
        <p className="mt-6 max-w-xl text-mist">
          Every plan includes live tracking, proof photos, the 15-point
          quality check, and eco-friendly, water-efficient methods. A once-off
          wash is R180 if you want to try Glint first.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal
              key={p.name}
              as="article"
              delay={i * 0.12}
              className={
                p.featured
                  ? "surface-2 halo relative flex flex-col rounded-card p-8"
                  : "surface-1 lift flex flex-col rounded-card p-8"
              }
            >
              {p.featured ? (
                <span className="absolute right-6 top-6 rounded-pill bg-lemon px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-carbon">
                  Most booked
                </span>
              ) : null}
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                {p.name}
              </h2>
              <p className="mt-4 text-5xl font-extrabold tracking-[-0.03em]">
                {p.price}
              </p>
              <p className="mt-1 text-sm text-steel">{p.per}</p>
              <p className="mt-3 text-sm text-mist">{p.blurb}</p>
              <ul className="mt-8 flex grow flex-col gap-3 text-sm text-mist">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 border-t border-carbon-border pt-3">
                    <Icon name="check" size={15} className="mt-1 shrink-0 text-lemon" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={
                  p.featured
                    ? "btn-primary mt-10 py-3 text-center text-sm"
                    : "btn-secondary mt-10 py-3 text-center text-sm"
                }
              >
                Start with {p.name}
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-sm text-steel">
          Fleet deals for 10+ vehicles and estate-wide agreements are priced
          per site — <Link href="/partners" className="text-mist underline transition-colors hover:text-white">talk to us</Link>.
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-carbon-border bg-carbon-mid/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Questions, answered
          </h2>
          <dl className="mt-10 flex flex-col gap-4">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06} className="surface-1 rounded-card p-6">
                <dt className="font-semibold text-white">{f.q}</dt>
                <dd className="mt-2 text-sm text-mist">{f.a}</dd>
              </Reveal>
            ))}
          </dl>
          <div className="mt-12 text-center">
            <Link href="/sign-up" className="btn-primary inline-block px-8 py-4">
              Book your first wash
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
