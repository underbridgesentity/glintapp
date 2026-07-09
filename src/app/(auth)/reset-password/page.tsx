import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPasswordAction } from "../actions";
import { Wordmark } from "@/components/wordmark";
import { marketingHomeHref } from "@/lib/marketing-url";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) redirect("/forgot-password");
  const home = await marketingHomeHref();

  return (
    <main className="page-enter mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href={home} aria-label="Glint home" className="mb-8">
        <Wordmark className="text-3xl text-white" />
      </Link>

      <div className="glass surface-2 rounded-card p-8">
        <h1 className="text-3xl font-bold tracking-[-0.025em]">
          Set a new password
        </h1>
        <p className="mt-2 text-mist">8 characters minimum.</p>

        <form action={resetPasswordAction} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              New password
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
          <button type="submit" className="btn-primary mt-2 px-8 py-4">
            Save new password
          </button>
        </form>
      </div>
    </main>
  );
}
