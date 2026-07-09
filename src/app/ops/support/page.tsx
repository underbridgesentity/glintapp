import Link from "next/link";
import { z } from "zod";
import { requireRole } from "@/lib/guard";
import { Icon } from "@/components/icons";
import { getThread, listThreads, markThreadRead } from "@/lib/support";
import { sendOpsReplyAction } from "../actions";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toISOString().slice(5, 10);
}

function clock(date: Date) {
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OpsSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; error?: string }>;
}) {
  await requireRole(["ops_admin"]);
  const { customer: rawCustomer, error } = await searchParams;
  // Validate before any DB read/mutation — an invalid id must not reach
  // getThread/markThreadRead (a non-uuid throws Postgres 22P02).
  const customer = z.string().uuid().safeParse(rawCustomer).success
    ? rawCustomer
    : undefined;

  const threads = await listThreads();
  const selected = customer
    ? threads.find((t) => t.customerId === customer)
    : undefined;

  let conversation: Awaited<ReturnType<typeof getThread>> = [];
  if (customer) {
    conversation = await getThread(customer);
    await markThreadRead(customer, "ops");
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-white">
          Support
        </h1>
        <p className="mt-1 text-sm text-mist">
          {threads.length} conversation{threads.length === 1 ? "" : "s"}. Reply
          in the customer thread.
        </p>
      </header>

      {error ? (
        <p className="surface-1 rounded-card px-4 py-3 text-sm text-white">
          Message could not be sent. Keep it under 2000 characters.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Thread list */}
        <aside className="flex flex-col gap-2">
          {threads.length === 0 ? (
            <p className="surface-1 rounded-card p-4 text-sm text-mist">
              No conversations yet.
            </p>
          ) : (
            threads.map((t) => {
              const active = t.customerId === customer;
              const unread = Number(t.unread ?? 0);
              return (
                <Link
                  key={t.customerId}
                  href={`/ops/support?customer=${t.customerId}`}
                  className={`card-hover block rounded-card border p-3 transition-colors duration-200 ${
                    active
                      ? "border-lemon-border bg-carbon-raise"
                      : "border-carbon-border bg-carbon-mid"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {t.customerName}
                    </span>
                    <span className="shrink-0 text-[11px] text-steel">
                      {timeAgo(new Date(t.lastAt))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-mist">{t.lastBody}</p>
                    {unread > 0 ? (
                      <span className="shrink-0 rounded-pill bg-lemon-dim px-2 py-0.5 text-[11px] font-bold text-lemon">
                        {unread}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })
          )}
        </aside>

        {/* Conversation */}
        <section className="flex min-h-[420px] flex-col surface-1 rounded-card">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-mist">
                <Icon name="message" size={28} />
              </span>
              <p className="text-sm text-mist">
                {threads.length === 0
                  ? "Conversations from customers land here."
                  : "Select a conversation to read and reply."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-carbon-border px-5 py-4">
                <span className="text-lemon">
                  <Icon name="message" size={18} />
                </span>
                <h2 className="text-base font-semibold text-white">
                  {selected.customerName}
                </h2>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                {conversation.length === 0 ? (
                  <p className="text-sm text-mist">No messages yet.</p>
                ) : (
                  conversation.map((msg) => {
                    const isOps = msg.senderRole === "ops";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isOps ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-card px-3.5 py-2.5 text-sm ${
                            isOps
                              ? "border border-lemon-border bg-lemon-dim text-white"
                              : "bg-carbon-raise text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.body}
                          </p>
                        </div>
                        <span className="mt-1 px-1 text-[11px] text-steel">
                          {isOps ? "You" : selected.customerName} ·{" "}
                          {clock(new Date(msg.createdAt))}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                action={sendOpsReplyAction}
                className="flex items-end gap-2 border-t border-carbon-border p-4"
              >
                <input type="hidden" name="customerId" value={selected.customerId} />
                <textarea
                  name="body"
                  required
                  rows={2}
                  maxLength={2000}
                  placeholder="Write a reply"
                  className="flex-1 resize-none rounded-card border border-carbon-border bg-carbon-raise px-3 py-2 text-sm text-white placeholder:text-steel focus:border-lemon-border focus:outline-none"
                />
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
