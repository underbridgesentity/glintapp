---
id: lazy-db-client
created: 2026-07-09
last-updated: 2026-07-09
session: phase-3-auth
author: agent
status: active
supersedes: none
---

# DB client must be lazily initialised

`neon(process.env.DATABASE_URL!)` at module scope crashes `next build`
(page-data collection imports the module without env vars). `src/db/index.ts`
wraps the client in a Proxy that connects on first property access.

## Why
Vercel builds and CI have no DATABASE_URL; connections must happen at
request time only. Any new module that touches env at import time will
reintroduce the same build failure.

## Change log
- 2026-07-09 — created after Phase 3 build failure (agent)
