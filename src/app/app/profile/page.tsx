import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { signOutAction } from "@/app/(auth)/actions";
import { Icon } from "@/components/icons";
import {
  changePasswordAction,
  updateNotificationPrefsAction,
  updateProfileAction,
} from "../actions";

export const dynamic = "force-dynamic";

const SAVED_COPY: Record<string, string> = {
  profile: "Profile saved.",
  prefs: "Notification preferences saved.",
  password: "Password changed.",
};

const ERROR_COPY: Record<string, string> = {
  profile: "Check your details and try again.",
  password: "Current password is wrong, or the new one is under 8 characters.",
};

const inputClass =
  "rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-white";
const labelClass =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-mist";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole(CUSTOMER_ROLES);
  const { saved, error } = await searchParams;

  const [[user], [subscription]] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.user.id)).limit(1),
    db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          isNull(subscriptions.deletedAt)
        )
      )
      .limit(1),
  ]);

  const prefs = (user.notificationPrefs ?? {}) as Record<string, boolean>;
  const hasCard = Boolean(subscription?.payfastToken);

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-mist">{user.email}</p>
      </header>

      {saved && SAVED_COPY[saved] ? (
        <p className="rounded-card border border-[var(--lemon-border)] bg-lemon-dim px-4 py-3 text-sm text-white">
          {SAVED_COPY[saved]}
        </p>
      ) : null}
      {error && ERROR_COPY[error] ? (
        <p className="rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
          {ERROR_COPY[error]}
        </p>
      ) : null}

      <section className="surface-1 rounded-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name="users" size={16} className="text-mist" /> Account
        </h2>
        <form action={updateProfileAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Full name</span>
            <input
              name="name"
              required
              defaultValue={user.name}
              autoComplete="name"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Phone</span>
            <input
              name="phone"
              defaultValue={user.phone ?? ""}
              autoComplete="tel"
              placeholder="For wash-day contact only"
              className={`${inputClass} placeholder:text-steel`}
            />
          </label>
          <button type="submit" className="btn-secondary self-start px-6 py-2.5 text-sm">
            Save profile
          </button>
        </form>
      </section>

      <section className="surface-1 rounded-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name="creditCard" size={16} className="text-mist" /> Payment
          method
        </h2>
        <p className="mt-3 text-sm text-mist">
          {hasCard
            ? "Card on file with PayFast. Billing runs automatically each month."
            : "No card on file yet. Your card is captured securely by PayFast at checkout — Glint never sees or stores card numbers."}
        </p>
        <Link
          href="/pay/checkout"
          className="btn-secondary mt-4 inline-block px-6 py-2.5 text-sm"
        >
          {hasCard ? "Update card at checkout" : "Add payment method"}
        </Link>
      </section>

      <section className="surface-1 rounded-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name="bell" size={16} className="text-mist" /> Notifications
        </h2>
        <form
          action={updateNotificationPrefsAction}
          className="mt-4 flex flex-col gap-3"
        >
          <label className="flex items-center justify-between gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
            Email me when my wash is done
            <input type="checkbox" name="washDone" defaultChecked={prefs.washDone !== false} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
            Email me when my wash starts
            <input type="checkbox" name="washStarted" defaultChecked={prefs.washStarted === true} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-card border border-carbon-border bg-carbon-raise px-4 py-3 text-sm text-white">
            Email me about billing
            <input type="checkbox" name="billing" defaultChecked={prefs.billing !== false} />
          </label>
          <button type="submit" className="btn-secondary self-start px-6 py-2.5 text-sm">
            Save preferences
          </button>
        </form>
      </section>

      <section className="surface-1 rounded-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name="shield" size={16} className="text-mist" /> Password
        </h2>
        <form action={changePasswordAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Current password</span>
            <input
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>New password</span>
            <input
              name="next"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <button type="submit" className="btn-secondary self-start px-6 py-2.5 text-sm">
            Change password
          </button>
        </form>
      </section>

      <form action={signOutAction}>
        <button type="submit" className="btn-secondary w-full px-6 py-3 text-sm">
          Sign out
        </button>
      </form>
    </div>
  );
}
