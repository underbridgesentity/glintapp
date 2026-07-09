import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-12 sm:max-w-2xl">
      <header>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
          Glint
        </span>
      </header>

      <section className="py-16">
        <h1 className="text-5xl font-bold leading-tight tracking-[-0.03em] sm:text-6xl">
          Your car is clean.
          <br />
          You weren&apos;t there.
          <br />
          That&apos;s the point.
        </h1>
        <p className="mt-6 text-mist">
          Glint cleans your car at your office park or estate while you work.
          Eco-friendly, water-efficient methods. Book before 8am. Clean by
          noon.
        </p>
      </section>

      <footer className="flex flex-col gap-3">
        <Link
          href="/sign-up"
          className="rounded-pill bg-lemon px-8 py-4 text-center font-semibold text-carbon"
        >
          Book your first wash
        </Link>
        <Link
          href="/sign-in"
          className="rounded-pill border border-carbon-border px-8 py-4 text-center font-semibold text-white"
        >
          Sign in
        </Link>
      </footer>
    </main>
  );
}
