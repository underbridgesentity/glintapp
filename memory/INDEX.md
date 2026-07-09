# Memory Index

## Decisions
- [rbac-two-layers](decisions/rbac-two-layers.md) — middleware + requireRole on every protected surface, active

## Patterns
- [scoped-parallel-agents](patterns/scoped-parallel-agents.md) — route-tree-scoped concurrent build agents, active

## Gotchas
- [lazy-db-client](gotchas/lazy-db-client.md) — no env/db access at import time or `next build` fails, active
- [cna-overwrites-claude-md](gotchas/cna-overwrites-claude-md.md) — create-next-app emits CLAUDE.md/AGENTS.md; scaffold merges must exclude root markdown, active
