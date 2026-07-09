import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, keyManagement } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { FIELD_ROLES } from "@/lib/roles";
import { Icon } from "@/components/icons";
import { assignedSiteFor } from "../data";
import {
  generateOtpAction,
  keyCheckInAction,
  keyCheckOutAction,
} from "../actions";
import { todayInJohannesburg } from "../checklist";

function stamp(d: Date | null) {
  if (!d) return null;
  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

export default async function KeysPage() {
  const session = await requireRole(FIELD_ROLES);
  const site = await assignedSiteFor(session.user.id);
  if (!site) {
    return (
      <p className="text-mist">
        No site assigned to your profile. Ask ops to assign you.
      </p>
    );
  }

  // Read the one-time code from the short-lived httpOnly cookie set by
  // generateOtpAction — never from the URL.
  const flash = (await cookies()).get("glint_otp_flash")?.value;
  const [otp, tag] = flash ? flash.split(":") : [undefined, undefined];

  const rows = await db
    .select({ key: keyManagement, bookingStatus: bookings.status })
    .from(keyManagement)
    .innerJoin(bookings, eq(keyManagement.bookingId, bookings.id))
    .where(
      and(
        eq(keyManagement.siteId, site.id),
        eq(bookings.scheduledDate, todayInJohannesburg()),
        isNull(bookings.deletedAt)
      )
    );

  return (
    <div className="flex flex-col gap-4">
      {otp ? (
        <div className="rounded-card border border-[var(--lemon-border)] bg-lemon-dim p-4">
          <p className="text-sm text-mist">
            One-time code for tag {tag}. Shown once — share it now.
          </p>
          <p className="text-3xl font-bold tracking-[0.2em] text-white">
            {otp}
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-mist">
          No keys to manage today. Keys appear with today&apos;s bookings.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ key, bookingStatus }) => (
            <li
              key={key.id}
              className="surface-1 rounded-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Icon name="key" size={16} className="text-mist" />
                  Tag {key.keyTagCode}
                </p>
                <span className="rounded-pill bg-carbon-raise px-4 py-1 text-xs text-mist">
                  {bookingStatus.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-mist">
                {key.checkedInAt ? `In ${stamp(key.checkedInAt)}` : "Not checked in"}
                {" · "}
                {key.checkedOutAt
                  ? `Out ${stamp(key.checkedOutAt)}`
                  : "Not checked out"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={keyCheckInAction}>
                  <input type="hidden" name="keyId" value={key.id} />
                  <button
                    type="submit"
                    className="btn-secondary px-4 py-2 text-sm "
                  >
                    Check in
                  </button>
                </form>
                <form action={keyCheckOutAction}>
                  <input type="hidden" name="keyId" value={key.id} />
                  <button
                    type="submit"
                    className="btn-secondary px-4 py-2 text-sm "
                  >
                    Check out
                  </button>
                </form>
                <form action={generateOtpAction}>
                  <input type="hidden" name="keyId" value={key.id} />
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Generate OTP
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-steel">
        Tags carry codes only. Never write customer names on tags.
      </p>
    </div>
  );
}
