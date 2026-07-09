import Link from "next/link";
import { signUpAction } from "../actions";
import { Wordmark } from "@/components/wordmark";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="page-enter mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" aria-label="Glint home" className="mb-8">
        <Wordmark className="text-3xl text-white" />
      </Link>

      <div className="glass surface-2 rounded-card p-8">
      <h1 className="text-3xl font-bold tracking-[-0.025em]">
        Create your account
      </h1>
      <p className="mt-2 text-mist">
        Book your first wash in under 2 minutes.
      </p>

      {error ? (
        <p className="mt-4 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
          {error === "exists"
            ? "That email already has an account. Sign in instead."
            : "Check your details and try again. Password needs 8 characters."}
        </p>
      ) : null}

      <form action={signUpAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            Full name
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
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
            I am
          </legend>
          <label className="flex items-center gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3">
            <input
              type="radio"
              name="role"
              value="residential_subscriber"
              defaultChecked
            />
            <span>A resident. My car lives where I do.</span>
          </label>
          <label className="flex items-center gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3">
            <input type="radio" name="role" value="fleet_manager" />
            <span>A fleet manager. 2 or more vehicles, one invoice.</span>
          </label>
          <label className="flex items-center gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3">
            <input type="radio" name="role" value="once_off" />
            <span>Here for a single wash.</span>
          </label>
        </fieldset>
        <button
          type="submit"
          className="btn-primary mt-2 px-8 py-4"
        >
          Create account
        </button>
      </form>
      </div>

      <p className="mt-6 text-sm text-mist">
        Already registered?{" "}
        <Link href="/sign-in" className="font-semibold text-white underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
