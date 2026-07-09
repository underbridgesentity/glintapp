import Link from "next/link";
import { signInAction } from "../actions";
import { Wordmark } from "@/components/wordmark";
import { marketingHomeHref } from "@/lib/marketing-url";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; reset?: string }>;
}) {
  const { error, callbackUrl, reset } = await searchParams;
  const home = await marketingHomeHref();
  return (
    <main className="page-enter mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href={home} aria-label="Glint home" className="mb-8">
        <Wordmark className="text-3xl text-white" />
      </Link>

      <div className="glass surface-2 rounded-card p-8">
        <h1 className="text-3xl font-bold tracking-[-0.025em]">Sign in</h1>
        <p className="mt-2 text-mist">Your car is waiting.</p>

        {error ? (
          <p className="mt-4 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
            Wrong email or password. Try again.
          </p>
        ) : null}
        {reset === "1" ? (
          <p className="mt-4 rounded-card border border-[var(--lemon-border)] bg-lemon-dim px-4 py-3 text-sm text-white">
            Password updated. Sign in with the new one.
          </p>
        ) : null}

        <form action={signInAction} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
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
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            className="btn-primary mt-2 px-8 py-4"
          >
            Sign in
          </button>
          <Link
            href="/forgot-password"
            className="text-sm text-mist underline underline-offset-4 hover:text-white"
          >
            Forgot password?
          </Link>
        </form>
      </div>

      <p className="mt-6 text-sm text-mist">
        New to Glint?{" "}
        <Link href="/sign-up" className="font-semibold text-white underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-xs text-steel">
        <Link href="/terms" className="underline hover:text-mist">Terms of service</Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-mist">Privacy policy</Link>
      </p>
    </main>
  );
}
