# CLAUDE.md — Glint Project Constitution

Read this file at the start of every session. It holds the slow-moving truths of the project. Changing anything here is a deliberate amendment, not an accretion. For accumulated, fast-moving knowledge (decisions, patterns, gotchas), see `AGENTS.md` and the `memory/` store.

---

## What Glint is

Glint is a software platform. The car wash is the product; the platform is the business. Model it like Uber: technicians are a background process, the app is the interface, the operating system has the value. Glint is a technology company that happens to clean cars.

Glint operates at South African office parks and residential estates. Technicians arrive while customers work or sleep, complete a full wash and interior clean using **eco-friendly, water-efficient methods and reclaim products**, and leave before the customer notices. The customer books, pays, and verifies through the app.

Positioning: **Glint sells time. The clean car is proof it worked.**

---

## Non-negotiable rules

1. **Eco-friendly, never waterless.** Glint uses water, efficiently. No file, schema field, comment, or copy may say "waterless." Say "eco-friendly" or "water-efficient."
2. **No AI in the product.** No Claude API, no chatbot, no ML, no vector store, no "agent memory" inside the deployed app. All agent intelligence lives at the build layer only (`AGENTS.md`, `memory/`) and is never exposed to users.
3. **Dark mode always.** There is no light mode. Do not build one.
4. **Three colours, no exceptions.** No secondary colours, no gradients, no tints beyond the one defined lemon-dim overlay.
5. **Electric Lemon at most twice per screen.** It signals action. When in doubt, use white.
6. **Never white text on lemon.** Lemon fills carry Carbon Black (`#0C0C0C`) text.
7. **Every schema change is a checked-in Drizzle migration.** Never an ad-hoc push to production.
8. **RBAC is enforced server-side.** Never client-only.

---

## Stack (settled, do not substitute)

- Next.js (App Router, latest stable), TypeScript, RSC where sensible
- Vercel hosting; Vercel-native primitives
- Vercel Postgres (Neon), Drizzle ORM + drizzle-kit, schema-first, migrations checked in
- Vercel Blob for all uploaded imagery
- Auth.js (NextAuth v5), email + password to start, session-based, role-aware
- Tailwind CSS, dark only, brand tokens as CSS variables
- **Payments: PayFast** (live v1) behind a `PaymentProvider` interface; Yoco addable later. ITN webhook must validate signature, host, and amount, and be idempotent. Client-reported success is never trusted.
- **Notifications: DB-logged for v1.** WhatsApp is out of scope for v1, added later via Twilio behind the `NotificationService` interface.
- Imagery generated at build time via Magnific / Freepik MCP; stored in Blob.

---

## Brand tokens

```
--carbon:        #0C0C0C   /* primary background */
--carbon-mid:    #141414   /* cards, panels */
--carbon-raise:  #1C1C1C   /* inputs, raised surfaces */
--carbon-border: #2A2A2A   /* hairline borders */
--steel:         #5A5A5A   /* muted / disabled text */
--mist:          #8C8C8C   /* secondary body text */
--white:         #F8F8F8   /* primary text, headings */
--lemon:         #CDFF00   /* the ONLY signal colour */
--lemon-dim:     rgba(205, 255, 0, 0.12)   /* only permitted overlay */
--lemon-border:  rgba(205, 255, 0, 0.3)
```

Typography: Inter only, `display=swap`. Weight is hierarchy, not colour. Never lemon inside body copy (use weight 600 + white). Radius: 8px cards, 100px pills. Body capped at 65 chars/line, left-aligned, never justified.

---

## Tone of voice (all UI copy, notifications, empty states)

Brief. Confident. Factual. Second person. Active voice. Outcome first, method second. No exclamation marks, no ellipses. Banned words: revolutionary, disruptive, game-changing, passionate, committed, dedicated (unless followed by proof). Prefer a number over an adjective.

Register targets: "Your car is clean. You weren't there. That's the point." / "Book before 8am. Clean by noon." / "Last cleaned: Today at 11:42."

---

## Roles

Residential Subscriber · Corporate/Fleet Manager · Once-Off/Walk-In · Technician · Site Lead · Operations Manager/Admin · Property Developer Partner (B2B). Permissions are data-driven and enforced server-side.

---

## Seed personas (names retained, brand corrected)

- **Thandi**, 32, Sandton, BMW 3 Series silver. Premium R750/month, Tue + Fri.
- **Sipho**, 27, Waterfall estate, VW Polo. Basic R450/month, 4 exterior washes.
- **Linda**, 45, Rosebank office park, Fleet Manager, 30 vehicles. Fleet R350/vehicle/month.
- **David**, 52, REIT Development Director. Portfolio Partnership, 10+ sites, 5% revenue share.

---

## Phase plan

1. Foundation (stack + `CLAUDE.md` + `AGENTS.md` + `memory/` + subagents, deploys to preview)
2. Data + seed
3. Auth + roles
4. Customer core
5. Payments (PayFast + ITN)
6. Technician core
7. Ops + partner
8. Polish (PWA, imagery, a11y)

Run the relevant review subagent at the end of each phase. Do not jump ahead.
