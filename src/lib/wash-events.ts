import { db } from "@/db";
import { washEvents } from "@/db/schema";

type Kind =
  | "booked"
  | "queued"
  | "claimed"
  | "arrived"
  | "in_progress"
  | "checklist_progress"
  | "photos_uploaded"
  | "complete"
  | "re_wash";

// Append one row to a wash's timeline. Never throws into the caller's flow —
// timeline logging must not block a booking or completion.
export async function logWashEvent(input: {
  bookingId: string;
  kind: Kind;
  note?: string;
  progress?: number;
  actorId?: string;
}) {
  try {
    await db.insert(washEvents).values({
      bookingId: input.bookingId,
      kind: input.kind,
      note: input.note ?? null,
      progress: input.progress ?? null,
      actorId: input.actorId ?? null,
    });
  } catch {
    // Timeline is best-effort; the wash record is the source of truth.
  }
}
