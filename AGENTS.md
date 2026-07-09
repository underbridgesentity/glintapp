# AGENTS.md — Memory & Context Operating Principles

These are the operating principles for how you (Claude Code) manage memory, context, and skills while building Glint. Follow them by default. This system is build-tooling. None of it ships in the Glint product, and none of it is exposed to end users.

`CLAUDE.md` is the constitution: slow-moving truths, read every session. This file governs the fast-moving, accumulated knowledge that lives under `./memory/`.

---

## Memory as a file system

- Store long-term memory as plain markdown files under `./memory/`, organised into a sensible structure:
  - `memory/decisions/` — architectural and product decisions, with the reasoning behind them
  - `memory/patterns/` — approaches that worked and are worth repeating
  - `memory/gotchas/` — mistakes made, bugs hit, and non-obvious constraints to avoid repeating
- Read and write memory using ordinary tools (read, write, bash, grep). Do NOT invent bespoke memory APIs or special formats.
- Keep individual files readable and focused. The store may grow large. That is fine as long as it stays well organised and searchable.

## Progressive disclosure

- Do not load the entire memory store or all skills up front.
- Maintain a lightweight index at `memory/INDEX.md` listing what exists and where. Consult the index first, then pull only the specific file(s) you need.
- Prefer grep and targeted reads over loading everything, so the context window stays lean.

## Autonomy over memory

- During a task, decide for yourself when to read from memory and when something is worth recording. Write down durable facts: decisions made, patterns that worked, mistakes to avoid, and non-obvious constraints.
- Periodically, and at the end of each session, run a distillation pass: review what happened, consolidate the useful parts into memory, and prune noise. Focus on architectural decisions, recurring bugs, and project-specific conventions.
- Do not record secrets, credentials, or PII in memory. Memory is committed to Git; treat it as public to the team.

## Versioning (make every write revertible)

- Never silently overwrite memory. For each write, record:
  - what changed, and why
  - what triggered it (which task or session)
  - who or what made the change (agent or human)
- Prefer append-and-supersede over destructive edits. When a fact changes, mark the old entry as superseded and add the new one, rather than deleting the old. History stays recoverable.
- The repo is on Git, so every memory write is also a normal commit. Git is the machine-level revert path; the in-file change note is the human-readable layer on top. Use a clear commit message for memory changes, e.g. `memory: supersede payment-provider decision (Yoco -> PayFast)`.

## File format

Each memory entry carries a small header so it is self-describing:

```
---
id: <short-slug>
created: <ISO date>
last-updated: <ISO date>
session: <task or session reference>
author: <agent | human>
status: active | superseded
supersedes: <id or none>
---

# <Title>

<The durable fact, decision, pattern, or gotcha, stated plainly.>

## Why
<The reasoning. This is the part that saves the next session.>

## Change log
- <ISO date> — <what changed and why> (<agent | human>)
```

## INDEX.md convention

`memory/INDEX.md` is the map you read first. Keep it current on every write:

```
# Memory Index

## Decisions
- [drizzle-over-prisma](decisions/drizzle-over-prisma.md) — ORM choice, active
- [payfast-live-v1](decisions/payfast-live-v1.md) — payment provider, active

## Patterns
- [rbac-server-guard](patterns/rbac-server-guard.md) — server-side role check pattern, active

## Gotchas
- [payfast-itn-idempotency](gotchas/payfast-itn-idempotency.md) — replayed ITNs double-credit if not guarded, active
- [technician-offline-shell](gotchas/technician-offline-shell.md) — basement signal loss, active
```

## Distillation pass (end of session)

Run the `distill-memory` slash command, or do it manually:

1. Read `memory/INDEX.md`.
2. Review what this session did: what was decided, what worked, what broke.
3. For each durable item, add or update a memory file with a proper header and change-log entry.
4. Mark superseded entries rather than deleting them.
5. Update `INDEX.md`.
6. Commit with a `memory:` prefixed message.

Keep it tight. If nothing durable happened, record nothing. Memory is for facts that will save a future session, not a session diary.

---

## Relationship to the review subagents

The subagents (`brand-enforcer`, `schema-guardian`, `voice-checker`, `security-reviewer`) enforce the rules in `CLAUDE.md`. When one of them catches a recurring class of mistake, that is a signal to write a `gotcha`, so the mistake is prevented earlier next time rather than only caught at review.
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
