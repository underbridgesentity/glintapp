---
id: cna-overwrites-claude-md
created: 2026-07-09
last-updated: 2026-07-09
session: marketing-redesign
author: agent
status: active
supersedes: none
---

# create-next-app scaffolds its own CLAUDE.md/AGENTS.md and they overwrote ours

The Phase 1 rsync of the create-next-app output replaced the Glint
constitution (CLAUDE.md) and memory principles (AGENTS.md) with the
generated Next.js agent stubs, unnoticed for several commits. Restored from
commit 9cf4bbf; the Next.js "not the version you know" note is appended to
AGENTS.md.

## Why
Newer create-next-app emits CLAUDE.md/AGENTS.md. Any future scaffold-merge
into this repo must exclude or diff-check root markdown files.

## Change log
- 2026-07-09 — created after discovering the overwrite (agent)
