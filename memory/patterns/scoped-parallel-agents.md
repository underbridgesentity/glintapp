---
id: scoped-parallel-agents
created: 2026-07-09
last-updated: 2026-07-09
session: phases-4-7
author: agent
status: active
supersedes: none
---

# Route-tree-scoped parallel agents work for phase builds

Phases 4–7 were built by four concurrent agents, each locked to one route
tree (/app, /pay+lib/payments, /tech, /ops+/partner) with shared infra
(guard, roles, notifications, db) built first by the orchestrator. Zero file
conflicts; each phase committed as its scoped paths landed.

## Why
Glint's role areas are naturally disjoint subtrees. Build shared interfaces
before fanning out, forbid agents from touching package.json/schema/auth,
and commit per-scope so review stays per-phase.

## Change log
- 2026-07-09 — created (agent)
