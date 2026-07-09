import { requireRole } from "@/lib/guard";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { getThread, markThreadRead } from "@/lib/support";
import { Icon } from "@/components/icons";
import { sendSupportMessageAction } from "../actions";

export const dynamic = "force-dynamic";

function time(d: Date) {
  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

export default async function SupportPage() {
  const session = await requireRole(CUSTOMER_ROLES);

  // Reading the thread clears the customer's unread markers on the ops replies.
  await markThreadRead(session.user.id, "customer");
  const thread = await getThread(session.user.id);

  return (
    <div className="flex flex-col gap-6 py-2">
      <header>
        <div className="flex items-center gap-2">
          <span className="text-mist">
            <Icon name="message" size={18} />
          </span>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-white">
            Support
          </h1>
        </div>
        <p className="mt-1 text-sm text-mist">
          A person answers. Ask about any wash.
        </p>
      </header>

      {thread.length === 0 ? (
        <div className="rounded-card border border-carbon-border bg-carbon-mid p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-carbon-raise text-mist">
            <Icon name="message" size={22} />
          </span>
          <p className="mx-auto mt-4 max-w-xs text-sm text-white">
            No messages yet. Ask us anything about your washes.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {thread.map((m) => {
            const mine = m.senderRole === "customer";
            return (
              <li
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-card px-4 py-2.5 ${
                    mine ? "bg-lemon-dim" : "bg-carbon-raise"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm text-white">
                    {m.body}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-mist" : "text-steel"
                    }`}
                  >
                    {mine ? "You" : "Glint"} · {time(m.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        action={sendSupportMessageAction}
        className="flex items-end gap-2 border-t border-carbon-border pt-4"
      >
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={1}
          placeholder="Write a message"
          className="min-h-[46px] flex-1 resize-none rounded-card border border-carbon-border bg-carbon-mid px-4 py-3 text-sm text-white placeholder:text-steel"
        />
        <button
          type="submit"
          className="btn-press flex h-[46px] shrink-0 items-center rounded-pill bg-lemon px-6 font-semibold text-carbon"
        >
          Send
        </button>
      </form>
    </div>
  );
}
