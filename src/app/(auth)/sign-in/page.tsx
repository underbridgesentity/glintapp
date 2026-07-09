import Link from "next/link";
import { signInAction } from "../actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-bold tracking-[-0.025em]">Sign in</h1>
      <p className="mt-2 text-mist">Your car is waiting.</p>

      {error ? (
        <p className="mt-4 rounded-card border border-carbon-border bg-carbon-mid px-4 py-3 text-sm text-white">
          Wrong email or password. Try again.
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
          className="mt-2 rounded-pill bg-lemon px-8 py-4 font-semibold text-carbon"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        New to Glint?{" "}
        <Link href="/sign-up" className="font-semibold text-white underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
