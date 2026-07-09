import Image from "next/image";
import Link from "next/link";

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
    features: ["4 exterior washes", "Scheduled wash days", "Wash history and proof photos"],
  },
  {
    name: "Premium",
    price: "R750",
    per: "per month",
    features: ["8 washes, interior and exterior", "Priority scheduling, 2 days a week", "Key-safe lockbox handling"],
  },
  {
    name: "Fleet",
    price: "R350",
    per: "per vehicle / month",
    features: ["Weekly on-site washes", "One consolidated invoice", "Per-vehicle status dashboard"],
  },
];

export default function Marketing() {
  return (
    <main className="bg-carbon text-white">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-carbon-border/60 bg-carbon/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-extrabold tracking-[0.14em]">GLINT</span>
          <div className="flex items-center gap-6 text-sm">
            <a href="#how" className="hidden text-mist hover:text-white sm:block">
              How it works
            </a>
            <a href="#plans" className="hidden text-mist hover:text-white sm:block">
              Plans
            </a>
            <a href="#sites" className="hidden text-mist hover:text-white sm:block">
              For sites
            </a>
            <Link
              href="/sign-in"
              className="rounded-pill border border-carbon-border px-5 py-2 font-semibold hover:border-white"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-dvh items-end overflow-hidden">
        <Image
          src="/images/hero-garage.jpg"
          alt="A clean dark sedan alone under a single light in an underground parking garage"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-carbon/30" />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, var(--carbon), transparent)" }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-40">
          <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Office parks · Residential estates · South Africa
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            Your car is clean.
            <br />
            You weren&apos;t there.
            <br />
            That&apos;s the point.
          </h1>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/sign-up"
              className="rounded-pill bg-lemon px-8 py-4 text-center font-semibold text-carbon"
            >
              Book your first wash
            </Link>
            <p className="text-sm text-mist">Book before 8am. Clean by noon.</p>
          </div>
        </div>
      </section>

      {/* Positioning strip */}
      <section className="border-y border-carbon-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-carbon-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["30–40", "cars cleaned per site, per day"],
            ["15", "quality points checked on every wash"],
            ["0", "minutes of your time required"],
          ].map(([stat, label]) => (
            <div key={label} className="px-6 py-10">
              <p className="text-4xl font-extrabold tracking-[-0.03em]">{stat}</p>
              <p className="mt-1 text-sm text-mist">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          Glint sells time. The clean car is proof it worked.
        </h2>
        <div className="mt-16 grid gap-px overflow-hidden rounded-card border border-carbon-border bg-carbon-border sm:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="bg-carbon-mid p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
                {s.n}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm text-mist">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Eco panel */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-28 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-card border border-carbon-border">
          <Image
            src="/images/detail-panel.jpg"
            alt="Macro of a spotless black door panel reflecting cool ambient light"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
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
        </div>
      </section>

      {/* Technician panel */}
      <section className="border-y border-carbon-border bg-carbon-mid">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
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
          </div>
          <div className="relative order-1 aspect-[3/4] overflow-hidden rounded-card border border-carbon-border lg:order-2">
            <Image
              src="/images/technician.jpg"
              alt="A focused Glint technician in matte black uniform detailing a silver sedan"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="mx-auto max-w-6xl px-6 py-28">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Plans
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          One number. No surprises.
        </h2>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className="flex flex-col rounded-card border border-carbon-border bg-carbon-mid p-8"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                {p.name}
              </h3>
              <p className="mt-4 text-5xl font-extrabold tracking-[-0.03em]">
                {p.price}
              </p>
              <p className="mt-1 text-sm text-steel">{p.per}</p>
              <ul className="mt-8 flex flex-col gap-3 text-sm text-mist">
                {p.features.map((f) => (
                  <li key={f} className="border-t border-carbon-border pt-3">
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-10 rounded-pill border border-carbon-border py-3 text-center text-sm font-semibold hover:border-white"
              >
                Start with {p.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Sites / partners */}
      <section id="sites" className="relative overflow-hidden border-t border-carbon-border">
        <Image
          src="/images/site-dusk.jpg"
          alt="A modern South African office park at dusk"
          fill
          className="object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, var(--carbon) 30%, transparent)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-32">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
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
            className="mt-10 inline-block rounded-pill border border-carbon-border px-8 py-4 font-semibold hover:border-white"
          >
            Partner with Glint
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-carbon-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-28">
          <h2 className="max-w-3xl text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            Park in the morning.
            <br />
            Drive home clean.
          </h2>
          <Link
            href="/sign-up"
            className="rounded-pill bg-lemon px-8 py-4 font-semibold text-carbon"
          >
            Book your first wash
          </Link>
        </div>
      </section>

      <footer className="border-t border-carbon-border">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-10 text-sm text-steel sm:flex-row">
          <span className="font-extrabold tracking-[0.14em] text-mist">GLINT</span>
          <p>Eco-friendly, water-efficient car care. Johannesburg.</p>
        </div>
      </footer>
    </main>
  );
}
