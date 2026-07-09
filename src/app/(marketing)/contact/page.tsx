import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { submitContactAction } from "./actions";

export const metadata: Metadata = {
  title: "Contact — Glint",
  description:
    "Reach Glint. Customers get answers in the app. Estates and office parks can request Glint on site.",
};

const ROUTES: {
  icon: IconName;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    icon: "message",
    title: "Already a customer?",
    body: "The fastest route is the in-app chat. A person answers, and your washes stay attached to the conversation.",
    href: "/app/support",
    cta: "Open support in the app",
  },
  {
    icon: "building",
    title: "Estate or office park?",
    body: "Partnership enquiries have their own desk: revenue share, site requirements, and a co-branded dashboard.",
    href: "/partners",
    cta: "Partner with Glint",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main className="page-enter mx-auto max-w-6xl px-6 pb-28 pt-36">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lemon">
        Contact
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
        Talk to Glint.
      </h1>
      <p className="mt-4 max-w-lg text-mist">
        Two of these have a faster lane. Pick the right one and you skip the
        queue.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {ROUTES.map((r) => (
          <Reveal key={r.title} className="surface-1 card-hover rounded-card p-8">
            <span className="icon-chip">
              <Icon name={r.icon} size={18} />
            </span>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
              {r.title}
            </h2>
            <p className="mt-2 text-sm text-mist">{r.body}</p>
            <Link
              href={r.href}
              className="btn-secondary mt-6 inline-block px-6 py-2.5 text-sm"
            >
              {r.cta}
            </Link>
          </Reveal>
        ))}
      </div>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            Not at your site yet?
          </h2>
          <p className="mt-3 max-w-md text-mist">
            Tell us where you park. Enough requests from one estate or office
            park moves it to the top of the launch list.
          </p>
          <p className="mt-3 max-w-md text-mist">
            Questions, press, and anything else land here too. We reply within
            1 business day.
          </p>
          <p className="mt-6 text-sm text-steel">
            Glint · Johannesburg, South Africa
          </p>
        </Reveal>

        <Reveal delay={0.1} className="glass surface-2 rounded-card p-8">
          {sent === "1" ? (
            <div className="flex flex-col items-start gap-3">
              <span className="icon-chip text-lemon">
                <Icon name="checkCircle" size={18} />
              </span>
              <h2 className="text-xl font-semibold">Received.</h2>
              <p className="text-sm text-mist">
                Your message is with the team. We reply within 1 business day.
              </p>
              <Link href="/" className="btn-secondary mt-2 px-6 py-2.5 text-sm">
                Back to home
              </Link>
            </div>
          ) : (
            <form action={submitContactAction} className="flex flex-col gap-4">
              {sent === "invalid" ? (
                <p className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
                  Check the details and try again. Coverage requests need the
                  estate or office park name.
                </p>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  Name
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
                  Email
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
                  Topic
                </span>
                <select
                  name="topic"
                  className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                  defaultValue="coverage"
                >
                  <option value="coverage">Get Glint at my estate or office park</option>
                  <option value="question">A question before I sign up</option>
                  <option value="press">Press</option>
                  <option value="other">Something else</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  Estate or office park
                </span>
                <input
                  name="site"
                  placeholder="e.g. Waterfall City, Midrand"
                  className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white placeholder:text-steel"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
                  Message
                </span>
                <textarea
                  name="body"
                  rows={4}
                  className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
                />
              </label>
              <button type="submit" className="btn-primary mt-2 px-8 py-4">
                Send message
              </button>
            </form>
          )}
        </Reveal>
      </section>
    </main>
  );
}
