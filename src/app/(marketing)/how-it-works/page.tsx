import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Icon, type IconName } from "@/components/icons";

export const metadata: Metadata = {
  title: "How it works — Glint",
  description:
    "Park like you always do. A Glint technician washes your car at your estate or office park, verified with a 15-point check and proof photos.",
};

const RESIDENTIAL: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "creditCard",
    title: "Subscribe once",
    body: "Basic R450 or Premium R750 a month. Pick your wash days. Billing runs itself.",
  },
  {
    icon: "mapPin",
    title: "Park in your normal bay",
    body: "No keys needed for exterior washes. Premium interior cleans use the coded lockbox.",
  },
  {
    icon: "droplet",
    title: "We wash between 9am and 3pm",
    body: "Eco-friendly, water-efficient methods and reclaim products. No hose, no runoff.",
  },
  {
    icon: "bell",
    title: "Notified when it's done",
    body: "Proof photos and the full timeline in the app. Last cleaned: Today at 11:42.",
  },
];

const OFFICE: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "users",
    title: "Enrol as a fleet or individual",
    body: "Fleet managers get one invoice and a per-vehicle dashboard. Individuals subscribe like residents.",
  },
  {
    icon: "key",
    title: "Drop your key at the lockbox",
    body: "Or skip it for exterior-only. Tags carry codes, never names. OTP-secured access, every movement logged.",
  },
  {
    icon: "checkCircle",
    title: "15 points checked on every wash",
    body: "Each vehicle passes the same quality checklist before it's marked done.",
  },
  {
    icon: "route",
    title: "Key back, notification sent",
    body: "Your key returns to the lockbox and the app tells you. Drive home clean.",
  },
];

function Journey({
  label,
  heading,
  steps,
}: {
  label: string;
  heading: string;
  steps: { icon: IconName; title: string; body: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
        {label}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
        {heading}
      </h2>
      <ol className="mt-8 flex flex-col gap-4">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08} as="li" className="surface-1 flex gap-4 rounded-card p-5">
            <span className="icon-chip icon-chip-lemon">
              <Icon name={s.icon} size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-mist">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="bg-carbon pt-20 text-white">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
          How it works
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
          You never visit a car wash again.
        </h1>
        <p className="mt-6 max-w-xl text-mist">
          Glint operates where your car already spends its day — your estate
          or your office park. Technicians work a digital queue, every wash is
          verified, and you watch it happen live in the app.
        </p>
      </section>

      {/* Two journeys */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2">
        <Journey
          label="At your estate"
          heading="Residential: set it once, forget it"
          steps={RESIDENTIAL}
        />
        <Journey
          label="At your office park"
          heading="Office: park in the morning, done by 3"
          steps={OFFICE}
        />
      </section>

      {/* Keys + trust */}
      <section className="border-y border-carbon-border bg-carbon-mid/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <Reveal className="img-drift relative aspect-video overflow-hidden rounded-card border border-carbon-border">
            <Image
              src="/images/lockbox.jpg"
              alt="A matte-black key lockbox on a concrete pillar with a coded key tag"
              fill
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
              Key security
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
              Your keys never carry your name.
            </h2>
            <p className="mt-5 text-mist">
              Interior cleans need your key — so we treat it like money. Tags
              carry codes only. The lockbox opens with a one-time code
              generated per wash. Every check-in and check-out lands in an
              audit log your site manager can inspect.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Inside the wash */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
            The 15-point check
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Done means verified.
          </h2>
          <p className="mt-5 text-mist">
            A wash isn&apos;t complete until the technician passes all 15
            quality points — from water-efficient pre-rinse to the final
            walk-around — and uploads proof photos. You see the checklist
            progress live on your tracking page.
          </p>
          <p className="mt-4 text-mist">
            Rate any wash below 3 and we schedule a re-wash automatically. No
            forms, no phone calls.
          </p>
          <Link href="/sign-up" className="btn-primary mt-8 inline-block px-8 py-4">
            Book your first wash
          </Link>
        </Reveal>
        <Reveal delay={0.15} className="img-drift relative aspect-[4/3] overflow-hidden rounded-card border border-carbon-border">
          <Image
            src="/images/interior-detail.jpg"
            alt="A gloved hand detailing a black leather dashboard with a microfibre cloth"
            fill
            className="object-cover"
          />
        </Reveal>
      </section>
    </main>
  );
}
