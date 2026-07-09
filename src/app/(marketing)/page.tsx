import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { Icon, type IconName } from "@/components/icons";

const STEPS: { n: string; title: string; body: string; icon: IconName }[] = [
  {
    n: "01",
    title: "Park like you always do",
    body: "Your normal bay at your estate or office park. No keys needed for exterior washes.",
    icon: "mapPin",
  },
  {
    n: "02",
    title: "We arrive. You don't notice.",
    body: "A Glint technician cleans your car between 9am and 3pm using eco-friendly, water-efficient methods.",
    icon: "droplet",
  },
  {
    n: "03",
    title: "Notified when it's done",
    body: "Last cleaned: Today at 11:42. Proof photos in the app. Drive home clean.",
    icon: "bell",
  },
];

const ECO_FEATURES: { icon: IconName; label: string }[] = [
  { icon: "droplet", label: "Water-efficient reclaim process, no running hose" },
  { icon: "leaf", label: "No driveway runoff left behind" },
  { icon: "checkCircle", label: "15-point quality check on every wash" },
];

const TECH_FEATURES: { icon: IconName; label: string }[] = [
  { icon: "shield", label: "15-point checklist completed on every car" },
  { icon: "key", label: "OTP-secured lockboxes and coded key tags" },
  { icon: "camera", label: "Completion photos before your car is marked done" },
];

const PARTNER_FEATURES: { icon: IconName; label: string }[] = [
  { icon: "building", label: "Runs on your site with its own equipment and power" },
  { icon: "gauge", label: "Co-branded dashboard and monthly reconciliation" },
  { icon: "wallet", label: "Revenue share on portfolio deals" },
];

const PLANS = [
  {
    name: "Basic",
    price: "R450",
    per: "per month",
    featured: false,
    features: ["4 exterior washes", "Scheduled wash days", "Wash history and proof photos"],
  },
  {
    name: "Premium",
    price: "R750",
    per: "per month",
    featured: true,
    features: ["8 washes, interior and exterior", "Priority scheduling, 2 days a week", "Key-safe lockbox handling"],
  },
  {
    name: "Fleet",
    price: "R350",
    per: "per vehicle / month",
    featured: false,
    features: ["Weekly on-site washes", "One consolidated invoice", "Per-vehicle status dashboard"],
  },
];

const STATS: [string, string][] = [
  ["30–40", "cars cleaned per site, per day"],
  ["15", "quality points checked on every wash"],
  ["0", "minutes of your time required"],
];

export default function Marketing() {
  return (
    <main className="bg-carbon text-white">
      {/* Hero */}
      <section className="relative flex min-h-dvh items-end overflow-hidden">
        <div className="hero-drift absolute inset-0">
          <Image
            src="/images/hero-estate.jpg"
            alt="A clean dark sedan in an outdoor parking bay at a modern residential estate under an overcast sky"
            fill
            priority
            className="object-cover opacity-70"
          />
        </div>
        <div className="absolute inset-0 bg-carbon/30" />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, var(--carbon), transparent)" }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-44">
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            <span className="hero-rise block" style={{ "--d": "0.1s" } as React.CSSProperties}>
              You park.
            </span>
            <span className="hero-rise block" style={{ "--d": "0.25s" } as React.CSSProperties}>
              We wash.
            </span>
            <span className="hero-rise block text-lemon" style={{ "--d": "0.4s" } as React.CSSProperties}>
              You drive home clean.
            </span>
          </h1>
          <div
            className="hero-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ "--d": "0.6s" } as React.CSSProperties}
          >
            <Link
              href="/sign-up"
              className="btn-primary px-8 py-4 text-center"
            >
              Book your first wash
            </Link>
            <p className="text-sm text-mist">Book before 8am. Clean by noon.</p>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block">
          <span className="block h-10 w-px animate-pulse bg-carbon-border" />
        </div>
      </section>

      {/* Positioning strip — inverted */}
      <section className="bg-white text-carbon">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-carbon/10 px-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map(([stat, label], i) => (
            <Reveal key={label} delay={i * 0.12} className="px-8 py-16">
              <p className="text-6xl font-extrabold tracking-[-0.04em] sm:text-7xl">
                <CountUp value={stat} />
              </p>
              <p className="mt-3 text-sm font-medium text-carbon/60">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Glint sells time. The clean car is proof it worked.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              as="article"
              delay={i * 0.15}
              className="surface-1 lift group relative overflow-hidden rounded-card p-8"
            >
              <span aria-hidden className="ghost-numeral">{s.n}</span>
              <span className="icon-chip icon-chip-lemon relative">
                <Icon name={s.icon} size={18} />
              </span>
              <h3 className="relative mt-5 text-xl font-semibold tracking-[-0.02em]">
                {s.title}
              </h3>
              <p className="relative mt-3 text-sm text-mist">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Eco panel */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-28 lg:grid-cols-2">
        <Reveal className="img-drift relative aspect-square overflow-hidden rounded-card border border-carbon-border">
          <Image
            src="/images/detail-panel.jpg"
            alt="Macro of a spotless black door panel reflecting cool ambient light"
            fill
            className="object-cover"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
            Eco-friendly, water-efficient
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            A full clean.
            <br />
            A fraction of the water.
          </h2>
          <p className="mt-6 text-mist">
            Glint uses water — efficiently. Reclaim products and controlled
            application replace the running hose. Your car gets a full
            exterior wash and interior clean without the runoff a driveway
            wash leaves behind.
          </p>
          <p className="mt-4 text-mist">
            Every wash ends with a 15-point quality check and proof photos in
            the app.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {ECO_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-lemon-dim text-lemon">
                  <Icon name={f.icon} size={16} />
                </span>
                <span className="text-mist">{f.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Technician panel */}
      <section className="border-y border-carbon-border bg-carbon-mid">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 lg:grid-cols-2">
          <Reveal delay={0.15} className="order-2 lg:order-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
              The people behind it
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
              Trained technicians.
              <br />
              Verified work.
            </h2>
            <p className="mt-6 text-mist">
              Every Glint technician works a digital queue, completes the
              15-point checklist on every vehicle, and uploads completion
              photos before your car is marked done.
            </p>
            <p className="mt-4 text-mist">
              Keys are handled through coded tags and OTP-secured lockboxes.
              Your name never appears on a tag.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {TECH_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-lemon-dim text-lemon">
                    <Icon name={f.icon} size={16} />
                  </span>
                  <span className="text-mist">{f.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="img-drift relative order-1 aspect-[3/4] overflow-hidden rounded-card border border-carbon-border lg:order-2">
            <Image
              src="/images/technician.jpg"
              alt="A focused Glint technician in matte black uniform hand-drying a silver sedan in an outdoor office park bay"
              fill
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* Plans — inverted */}
      <section id="plans" className="scroll-mt-20 bg-white text-carbon">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-carbon/50">
              Plans
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
              One number. No surprises.
            </h2>
          </Reveal>
          <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal
                key={p.name}
                as="article"
                delay={i * 0.15}
                className={
                  p.featured
                    ? "card-pop halo relative flex flex-col rounded-card bg-carbon p-8 text-white lg:-my-4"
                    : "card-pop flex flex-col rounded-card border border-carbon/10 bg-white p-8 shadow-[0_2px_4px_rgba(12,12,12,0.08),0_24px_56px_-24px_rgba(12,12,12,0.35)]"
                }
                style={
                  p.featured
                    ? { background: "linear-gradient(160deg, var(--lemon-dim), transparent 45%), var(--carbon)" }
                    : undefined
                }
              >
                {p.featured ? (
                  <span className="absolute right-6 top-6 rounded-pill bg-lemon px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-carbon">
                    Most booked
                  </span>
                ) : null}
                <h3
                  className={`text-[11px] font-bold uppercase tracking-[0.14em] ${p.featured ? "text-lemon" : "text-carbon/50"}`}
                >
                  {p.name}
                </h3>
                <p className="mt-4 text-5xl font-extrabold tracking-[-0.03em]">
                  {p.price}
                </p>
                <p className={`mt-1 text-sm ${p.featured ? "text-mist" : "text-carbon/50"}`}>
                  {p.per}
                </p>
                <ul
                  className={`mt-8 flex grow flex-col gap-3 text-sm ${p.featured ? "text-mist" : "text-carbon/70"}`}
                >
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`border-t pt-3 ${p.featured ? "border-carbon-border" : "border-carbon/10"}`}
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={
                    p.featured
                      ? "btn-primary mt-10 py-3 text-center text-sm"
                      : "btn-press mt-10 rounded-pill bg-carbon py-3 text-center text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(12,12,12,0.5)]"
                  }
                >
                  Start with {p.name}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sites / partners */}
      <section id="sites" className="relative scroll-mt-20 overflow-hidden">
        <Image
          src="/images/site-dusk.jpg"
          alt="A modern South African office park at dusk"
          fill
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-carbon/50" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, var(--carbon) 30%, transparent)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-32">
          <Reveal className="glass max-w-xl rounded-card p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
              For estates and office parks
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
              An amenity your residents use every week.
            </h2>
            <p className="mt-6 text-mist">
              Glint operates on your site with its own equipment, power, and
              secure lockbox. Partners get a co-branded dashboard, monthly
              reconciliation, and a revenue share on portfolio deals.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {PARTNER_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-lemon-dim text-lemon">
                    <Icon name={f.icon} size={16} />
                  </span>
                  <span className="text-mist">{f.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/partners"
              className="btn-secondary mt-10 inline-block px-8 py-4"
            >
              Partner with Glint
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA — dark, glass panel, lemon as accent only */}
      <section className="relative overflow-hidden bg-carbon">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 80% at 50% 120%, var(--lemon-dim), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <Reveal className="glass glass-sheen mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-card px-8 py-20 text-center">
            <h2 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              Park in the morning.
              <br />
              Drive home clean<span className="text-lemon">.</span>
            </h2>
            <Link href="/sign-up" className="btn-primary inline-block px-8 py-4">
              Book your first wash
            </Link>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
