import Link from "next/link";
import { requestPasswordResetAction } from "../actions";
import { Wordmark } from "@/components/wordmark";
import { marketingHomeHref } from "@/lib/marketing-url";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const home = await marketingHomeHref();
  return (
    <main className="page-enter mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href={home} aria-label="Glint home" className="mb-8">
        <Wordmark className="text-3xl text-white" />
      </Link>

      <div className="glass surface-2 rounded-card p-8">
        <h1 className="text-3xl font-bold tracking-[-0.025em]">
          Reset your password
        </h1>

        {sent === "1" ? (
          <p className="mt-4 text-mist">
            If that email has an account, a reset link is on its way. It works
            once and expires in 30 minutes.
          </p>
        ) : (
          <>
            {sent === "expired" ? (
              <p className="mt-4 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
                That link has expired or was already used. Request a new one.
              </p>
            ) : (
              <p className="mt-2 text-mist">
                Enter your email. We send a single-use link.
              </p>
            )}
            <form
              action={requestPasswordResetAction}
              className="mt-8 flex flex-col gap-4"
            >
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
              <button type="submit" className="btn-primary mt-2 px-8 py-4">
                Send reset link
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-mist">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-white underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
