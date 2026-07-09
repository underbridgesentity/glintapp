import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";

const STEPS = [
  {
    n: "01",
    title: "Park like you always do",
    body: "Your normal bay at your estate or office park. No keys needed for exterior washes.",
  },
  {
    n: "02",
    title: "We arrive. You don't notice.",
    body: "A Glint technician cleans your car between 9am and 3pm using eco-friendly, water-efficient methods.",
  },
  {
    n: "03",
    title: "Notified when it's done",
    body: "Last cleaned: Today at 11:42. Proof photos in the app. Drive home clean.",
  },
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

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      glint<span className="text-lemon">.</span>
    </span>
  );
}

export default function Marketing() {
  return (
    <main className="bg-carbon text-white">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-carbon-border/60 bg-carbon/80 backdrop-blur">
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Glint home">
            <Wordmark className="text-3xl" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="#how"
              className="hidden text-mist transition-colors duration-300 hover:text-white sm:block"
            >
              How it works
            </a>
            <a
              href="#plans"
              className="hidden text-mist transition-colors duration-300 hover:text-white sm:block"
            >
              Plans
            </a>
            <a
              href="#sites"
              className="hidden text-mist transition-colors duration-300 hover:text-white sm:block"
            >
              For sites
            </a>
            <Link
              href="/sign-in"
              className="btn-press rounded-pill bg-lemon px-5 py-2 font-semibold text-carbon"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

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
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            <span className="hero-rise block" style={{ "--d": "0.1s" } as React.CSSProperties}>
              Your car is clean.
            </span>
            <span className="hero-rise block" style={{ "--d": "0.25s" } as React.CSSProperties}>
              You weren&apos;t there.
            </span>
            <span className="hero-rise block text-lemon" style={{ "--d": "0.4s" } as React.CSSProperties}>
              That&apos;s the point.
            </span>
          </h1>
          <div
            className="hero-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ "--d": "0.6s" } as React.CSSProperties}
          >
            <Link
              href="/sign-up"
              className="btn-press rounded-pill bg-lemon px-8 py-4 text-center font-semibold text-carbon"
            >
              Book your first wash
            </Link>
            <p className="text-sm text-mist">Book before 8am. Clean by noon.</p>
          </div>
        </div>
      </section>

      {/* Positioning strip — inverted */}
      <section className="bg-white text-carbon">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-carbon/10 px-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map(([stat, label], i) => (
            <Reveal key={label} delay={i * 0.12} className="px-6 py-12">
              <p className="text-5xl font-extrabold tracking-[-0.03em]">
                <CountUp value={stat} />
              </p>
              <p className="mt-2 text-sm font-medium text-carbon/60">{label}</p>
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
              className="card-hover group rounded-card border border-carbon-border bg-carbon-mid p-8 hover:bg-carbon-raise"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
                {s.n}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm text-mist">{s.body}</p>
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
                    ? "card-pop glow-lemon relative flex flex-col rounded-card bg-carbon p-8 text-white lg:-my-4"
                    : "card-pop flex flex-col rounded-card border border-carbon/10 bg-white p-8 shadow-[0_16px_48px_-24px_rgba(12,12,12,0.25)]"
                }
                style={
                  p.featured
                    ? { background: "linear-gradient(160deg, rgba(205,255,0,0.14), transparent 45%), var(--carbon)" }
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
                  className={`btn-press mt-10 rounded-pill py-3 text-center text-sm font-semibold ${
                    p.featured ? "bg-lemon text-carbon" : "bg-carbon text-white"
                  }`}
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
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
              For estates and office parks
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
              An amenity your residents use every week.
            </h2>
            <p className="mt-6 max-w-lg text-mist">
              Glint operates on your site with its own equipment, power, and
              secure lockbox. Partners get a co-branded dashboard, monthly
              reconciliation, and a revenue share on portfolio deals.
            </p>
            <Link
              href="/sign-in"
              className="btn-press mt-10 inline-block rounded-pill border border-white/40 px-8 py-4 font-semibold hover:border-white"
            >
              Partner with Glint
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA — lemon block */}
      <section className="bg-lemon text-carbon">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-28">
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              Park in the morning.
              <br />
              Drive home clean.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              href="/sign-up"
              className="btn-press inline-block rounded-pill bg-carbon px-8 py-4 font-semibold text-white"
            >
              Book your first wash
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-carbon-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-12 text-sm text-steel sm:flex-row sm:items-center">
          <Wordmark className="text-2xl text-white" />
          <p>Eco-friendly, water-efficient car care. Johannesburg.</p>
        </div>
      </footer>
    </main>
  );
}
