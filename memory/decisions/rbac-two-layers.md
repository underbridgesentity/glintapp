---
id: rbac-two-layers
created: 2026-07-09
last-updated: 2026-07-09
session: phase-3-auth
author: agent
status: active
supersedes: none
---

# RBAC is middleware + requireRole, never middleware alone

Route-prefix access lives in `src/lib/roles.ts` (`ROUTE_ACCESS`, data-driven).
`src/middleware.ts` redirects early, but every protected page, layout, server
action, and route handler ALSO calls `requireRole([...])` from
`src/lib/guard.ts`. Self-service sign-up is customer roles only; staff and
partner accounts are provisioned by ops.

## Why
Middleware can be bypassed (matcher gaps, direct server-action invocation).
The constitution requires server-side enforcement per route.

## Change log
- 2026-07-09 — created (agent)
