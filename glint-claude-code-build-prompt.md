# Glint Platform: Claude Code Build Prompt

You are building **Glint**, a production-oriented, mobile-first web application that will later become a native iOS app. Read this entire brief before writing code. Build in the phases described at the end. Do not skip the setup phase.

---

## 1. What Glint actually is

Glint is a software platform. The car wash is the product it sells; the platform is the business. Position it the way Uber positions itself: the technicians are a background process, the app is the interface, and the operating system is what has value. Every decision should reinforce that Glint is a technology company that happens to clean cars.

Glint operates at South African office parks and residential estates. Technicians arrive while customers work or sleep, complete a full wash and interior clean using **eco-friendly, water-efficient methods and reclaim products** (this is important: Glint is NOT waterless, it is eco-friendly and water-conscious, so any copy, schema field, or feature must say "eco-friendly" or "water-efficient," never "waterless"), and leave before the customer notices. The customer books, pays, and verifies entirely through the app.

Core positioning: **Glint sells time. The clean car is proof it worked.**

---

## 2. Stack (settled, do not substitute)

- **Framework:** Next.js (App Router, latest stable), TypeScript, React Server Components where sensible.
- **Hosting:** Vercel. Assume Vercel deployment from day one. Use Vercel-native primitives.
- **Database:** Vercel Postgres (Neon under the hood). Use `@vercel/postgres` or connect Neon directly via the pooled connection string, whichever gives cleaner local + preview + prod parity.
- **ORM:** Drizzle ORM with drizzle-kit for migrations. Schema-first. Every schema change is a checked-in migration, never an ad-hoc push to production.
- **Blob storage:** Vercel Blob for all uploaded imagery (vehicle photos, before/after wash proof, technician-uploaded completion photos).
- **Auth:** Auth.js (NextAuth v5). Email + password to start, with the structure in place to add social and OTP later. Session-based, role-aware.
- **Styling:** Tailwind CSS. Dark mode only (see brand section, there is no light mode). Use CSS variables mapped to the exact brand tokens.
- **Imagery generation:** Magnific / Freepik MCP (see section 8). This is a build-time asset-generation step, not a runtime product dependency.
- **Payments:** **PayFast** is the live v1 integration (South African gateway, supports once-off and recurring/subscription billing via tokenized card + ITN callbacks). Build it behind a `PaymentProvider` interface so a second provider (Yoco) can be added later as a new implementation, not a rewrite. Handle the PayFast ITN (Instant Transaction Notification) webhook properly: signature validation, source-IP/host verification, amount matching against the originating order, and idempotent processing so a replayed ITN never double-credits. Never trust client-reported payment success; the ITN is the source of truth.
- **Notifications:** WhatsApp is the primary channel in the real business but is explicitly **out of scope for v1** and will be added later via Twilio. For now, build a `NotificationService` interface with a DB-logging implementation (every "your car is done" event writes a real `notifications` row and is visible in the UI). Leave a clearly-marked, un-wired `TwilioWhatsAppProvider` seam so the later integration is a new implementation behind the same interface. Do not hard-code notification logic into route handlers.

**No AI features ship in the Glint product.** There is no Claude API, no chatbot, no ML, no vector store, and no "agent memory" inside the deployed application. Glint is a booking-and-operations platform. All agent intelligence in this project lives at the BUILD layer only (see section 7 and the `AGENTS.md` file), helping Claude Code construct the app. It is never exposed to end users.

Repo lives on Git. Assume `main` deploys to production, PRs deploy to Vercel previews. Include a sensible `.gitignore`, `.env.example`, and a `README.md` with local setup steps.

---

## 3. Brand system (non-negotiable, enforce in code)

Glint has three colours. No exceptions. No secondary colours, no gradients, no tints beyond the one defined overlay.

```
--carbon:        #0C0C0C   /* primary background, everything lives on this */
--carbon-mid:    #141414   /* card and panel backgrounds */
--carbon-raise:  #1C1C1C   /* inputs, interactive raised surfaces */
--carbon-border: #2A2A2A   /* hairline borders */
--steel:         #5A5A5A   /* muted / disabled text */
--mist:          #8C8C8C   /* secondary body text */
--white:         #F8F8F8   /* all primary text and headings */
--lemon:         #CDFF00   /* the ONLY signal colour: CTAs, status, logo mark */
--lemon-dim:     rgba(205, 255, 0, 0.12)   /* the only permitted overlay */
--lemon-border:  rgba(205, 255, 0, 0.3)
```

Hard rules to encode:

- **Dark mode always.** There is no light mode variant. Do not build one.
- **Electric Lemon appears at most twice per screen.** It signals action. When in doubt, use white. Consider a lint rule or a code-review subagent that flags excessive lemon usage.
- **Never white text on lemon.** Any lemon fill (buttons, pills) uses Carbon Black text (`#0C0C0C`). White on lemon is forbidden.
- **No gradients, no tints, no additional colours.** The lemon-dim overlay is the only opacity blend allowed.
- **Typography:** Inter only, served via Google Fonts with `display=swap`. Weight is the hierarchy, not colour. Never use lemon to emphasise inside body copy; use `font-weight: 600` and white instead.
  - Display 72-96px / -0.04em / 800
  - H1 48-64px / -0.03em / 700
  - H2 32-40px / -0.025em / 600
  - H3 20-24px / -0.02em / 600
  - Body 16px / 0 / 1.75 / 300
  - Small/Meta 12-13px / 0.01em / 400
  - Label/Tag 10-11px / 0.14em uppercase / 700
- **Corner radius:** 8px on cards, 100px (full pill) on buttons and status chips.
- Body copy capped at 65 characters per line, left-aligned, never justified.

**Tone of voice for all UI copy, push notifications, and empty states:** Brief. Confident. Factual. Second person. Active voice. Lead with the outcome, follow with the method. No exclamation marks, no ellipses, no "revolutionary / disruptive / game-changing," no "passionate / committed / dedicated." State the fact, move on. Prefer a number over an adjective. Examples of the target register: "Your car is clean. You weren't there. That's the point." / "Book before 8am. Clean by noon." / "Last cleaned: Today at 11:42."

---

## 4. User roles and profiles

Build these roles with proper role-based access control enforced server-side (middleware + per-route guards, never client-only). Model them cleanly so permissions are data-driven, not scattered through the code.

1. **Residential Subscriber** — an individual on a recurring plan. Manages their vehicle(s), schedule, wash history, payment method, and notifications. ~60% of the real revenue base.
2. **Corporate / Fleet Manager** — manages multiple vehicles under one account, sees a consolidated dashboard, one invoice, per-vehicle wash status and history. ~25% of revenue.
3. **Once-Off / Walk-In Customer** — a lightweight account or guest checkout for a single wash, pays via card tap or payment link.
4. **Technician** — a Glint field worker. Sees their assigned site, the day's wash queue, checks vehicles off against the 15-point quality checklist, uploads completion photos, triggers the "done" notification. Mobile-first workflow, this is the operational heart.
5. **Site Lead** — a technician with extra scope: manages the daily roster at one site, sees the site's daily report and targets (30-40 washes/day), handles escalations.
6. **Operations Manager / Admin** — full platform visibility: all sites, all bookings, revenue dashboard, mystery-shopper audit logs, escalations (any rating below 3 triggers a re-wash + investigation flag), technician management, site provisioning.
7. **Property Developer Partner (B2B)** — read-focused role for estate/office-park partners. Sees a co-branded amenity view: usage at their sites, a monthly reconciliation + revenue-share statement (real business uses a 5% revenue share on 10+ site portfolios). No access to individual customer PII beyond what a partner legitimately needs.

Seed the database with realistic personas so the platform is demonstrable on first run. Use the real persona research (names retained, brand corrected to Glint, method corrected to eco-friendly):

- **Thandi**, 32, Sandton, BMW 3 Series (silver). Premium Subscription R750/month, washed Tuesday and Friday. Values: convenience critical, price sensitivity low.
- **Sipho**, 27, Waterfall estate, VW Polo. Basic Subscription R450/month, 4 exterior washes. Values: eco-friendly critical, price-sensitive, app integration critical.
- **Linda**, 45, Rosebank office park, Fleet Manager, 30 vehicles. Fleet deal R350/vehicle/month, all washed weekly on-site. Values: quality guarantee very high, one invoice.
- **David**, 52, Development Director, REIT, 15 developments. Portfolio Partnership, 10+ sites, 5% revenue share, co-branded amenity.

Seed at least two Glint sites, a handful of technicians and a site lead, and enough bookings across past and future dates that every dashboard has real data to render.

---

## 5. Core data model

Design the Drizzle schema to cover at least the following. Use UUID primary keys, `created_at` / `updated_at` timestamps everywhere, and soft-delete (`deleted_at`) on anything a user could remove but ops might need to audit.

- **users** (auth identity, role, contact, notification preferences)
- **profiles** (role-specific extended fields, one-to-one with users)
- **vehicles** (owner, make, model, colour, plate, notes, photo refs in Blob)
- **sites** (name, type: residential-estate | office-park, address, geo, developer partner ref, daily target, operating hours, footprint notes)
- **site_requirements** (per-site: parking bays for equipment, power outlet, lockbox location, storage cage, signage permission) reflecting the real onboarding checklist
- **subscriptions** (plan: basic R450 | premium R750 | fleet-per-vehicle R350, status, billing anchor, scheduled wash days)
- **bookings / washes** (vehicle, site, scheduled window, technician, status: queued | in-progress | complete | re-wash, wash type: exterior | interior+exterior, timestamps, completion photos)
- **quality_checks** (the 15-point checklist per wash, pass/fail per point, technician, notes)
- **ratings** (per wash, 1-5, comment; a rating below 3 auto-creates an escalation)
- **escalations** (wash ref, reason, status, assigned ops user, resolution)
- **payments** (type: subscription-recurring | once-off | fleet-invoice | developer-reconciliation, amount, status, provider: payfast, provider_ref / pf_payment_id, method, raw ITN payload for audit)
- **payment_events** (append-only log of every ITN received: signature-valid flag, matched order, processing outcome, so replays and disputes are traceable)
- **notifications** (recipient, channel, template, payload, sent status) so the WhatsApp-style "Your car is done" flow is real data, not a fire-and-forget call
- **key_management** (lockbox, key tag code, check-in/check-out log, OTP access events) reflecting the security protocol: keys tagged with codes carrying no personal info, digital check-in/out, app-generated OTP for lockbox access
- **audit_log** (actor, action, entity, before/after) for anything security- or money-sensitive

Model the two customer journeys as first-class flows:

- **Residential:** Subscribe (WhatsApp/app, Basic R450 or Premium R750) → Schedule wash days → Park in normal bay (no keys) → Team arrives → Notify "done" → Auto monthly payment.
- **Office park:** Enrol (fleet or individual) → Park in the morning → Drop key at lockbox OR leave car for exterior-only → Team washes 9am-3pm → Key returned to lockbox + notification → Drive home clean.

---

## 6. Key screens to build (mobile-first, PWA-ready)

Build these as a mobile-first responsive web app that installs as a PWA (manifest, service worker, app icon in the lemon-on-carbon mark, splash screen). This is the bridge to the eventual native iOS build, so keep the component architecture clean and platform-agnostic where you can.

**Customer (residential / fleet / once-off):**
- Onboarding + role-aware sign-up
- Home / next wash status ("Silver BMW 3 Series — In progress", "Toyota RAV4 — Queued 14:00", primary CTA "Book next wash")
- Vehicle management (add car, photos, notes)
- Schedule management (pick wash days for subscribers)
- Wash history with before/after proof photos and per-wash rating prompt
- Subscription + plan management, payment method
- Fleet view (Linda): all vehicles, consolidated status, single invoice, per-vehicle history

**Technician / Site Lead (this is the operational core, prioritise it):**
- Today's queue for the assigned site
- Per-wash workflow: claim → complete 15-point checklist → upload completion photos → mark done (fires notification)
- Key management: log check-in/out against lockbox, OTP handling
- Daily report / site targets (30-40 washes)

**Ops / Admin:**
- Cross-site dashboard: bookings, revenue by segment, site performance vs target
- Escalations queue (auto-populated by sub-3 ratings), re-wash tracking
- Mystery-shopper audit entry and history
- Technician + site provisioning

**Developer Partner (David):**
- Co-branded amenity dashboard for their sites
- Monthly reconciliation + 5% revenue-share statement

Include realistic empty states, loading states, and error states, all written in Glint's voice.

---

## 7. Build-time agent memory, context, and workflow (addresses "make the flow incredible")

This is the part that makes Claude Code build Glint consistently across many sessions instead of re-deriving context each time. **This entire system is build-tooling. None of it ships in the Glint product.**

Before writing any feature code, create two files at the repo root and scaffold the memory store:

### `CLAUDE.md` — the constitution (rarely changes)
Read automatically at the start of every session. Contains the durable, slow-moving truths: the stack decisions, the three-colour brand rule, the "eco-friendly not waterless" rule, the "no AI in the product" rule, the role list, the tone-of-voice rules, and the phase plan. If something here changes, it is a deliberate amendment, not an accretion.

### `AGENTS.md` — memory and context operating principles
How the agent manages its own memory over the life of the build. Its full contents are specified in the companion `AGENTS.md` file delivered alongside this prompt. In summary it mandates:

- **Memory as a filesystem.** Durable knowledge lives as plain markdown under `./memory/`, organised into `memory/decisions/`, `memory/patterns/`, and `memory/gotchas/`. Read and write it with ordinary tools (read, write, bash, grep). No bespoke memory APIs, no special formats, no database for build memory.
- **Progressive disclosure.** Never load the whole store up front. Maintain `memory/INDEX.md` listing what exists and where. Consult the index first, grep for the specific file, pull only what the current task needs. Keep the context window lean.
- **Autonomy over memory.** During a task, decide independently when to read and when something is worth recording. Record durable facts: decisions made, patterns that worked, mistakes to avoid, non-obvious constraints.
- **Distillation passes.** At the end of a session (or when memory gets noisy), review what happened, consolidate the useful parts, prune the noise. Focus on architectural decisions, recurring bugs, and project conventions.
- **Revertible versioning.** Never silently overwrite. Every write records what changed and why, what triggered it (which task/session), and who made the change (agent or human). Prefer append-and-supersede over destructive edits, so history is always recoverable. Since the repo is on Git, every memory write is also a normal commit, which gives you the revert path for free; the in-file change note is the human-readable layer on top.

### Specialised review subagents (invoke deliberately)
Define these as `.claude/agents` or slash commands. They review diffs; they do not ship:

- `brand-enforcer` — rejects any hex outside the approved tokens, gradients, light-mode code, white-on-lemon, lemon used more than twice per screen, and the word "waterless" anywhere.
- `schema-guardian` — insists every schema change is a checked-in migration; checks UUID PKs, timestamps, soft-delete, and audit coverage on money and security tables.
- `voice-checker` — reviews user-facing copy against the tone rules (no exclamation marks, no hype words, second person, outcome-first).
- `security-reviewer` — checks server-side RBAC, no secrets in client bundles, no PII in developer-partner views beyond scope, audit logging on sensitive actions, and correct PayFast ITN validation (signature, host, amount, idempotency).

### Slash commands
For repetitive flows: scaffold-a-role, add-a-migration, generate-seed-data, distill-memory (runs the end-of-session consolidation pass).

The point of all of this is that by session three, Claude Code already knows why you chose Drizzle over Prisma, that lemon is capped at twice per screen, that PayFast ITNs must be idempotent, and which bug it hit last time it touched the technician offline view, without you re-explaining any of it.

---

## 8. Imagery via Magnific / Freepik MCP

Use the Magnific / Freepik MCP to generate the platform's hero and section imagery. Follow the Glint photography direction exactly, this is a strict brand constraint:

- **Look:** Moody, high-contrast, cinematic. Dark environments, single intentional light sources, sharp reflections, wet-look surfaces (reflection, not water droplets, since we do not market water).
- **Cars:** Black, grey, silver only. White acceptable only if paint quality is exceptional. No colourful cars.
- **Grade:** Slightly underexposed, crushed blacks, cool-neutral. No warm tones, no vignettes, no sun flares, no lens flare. Contrast in the shot, not in post. Light grain acceptable.
- **Never:** Bright generic car-park stock, posed smiling stock people, colourful backgrounds, decorative water droplets, anything that reads like a petrol-station carwash.

Generate at minimum: a hero anchor image (dark underground parking bay, single glass-clean sedan under one overhead light, high-gloss reflection on polished concrete, no people, architectural), a surface-detail macro (clean door panel reflecting ambient light), a technician-in-context shot (matte-black uniform, focused, not smiling, well-lit estate car park), and an establishing site shot (modern South African office park / estate, geometric, the matte-black lockbox as the only bright accent). Store generated assets in Vercel Blob and reference them from the DB, do not hot-link.

---

## 9. Production-readiness checklist (hold yourself to this)

- Server-side RBAC on every protected route, verified, not assumed.
- All secrets in env, `.env.example` documented, nothing sensitive in the client bundle.
- Input validation (zod) on every mutation and API boundary.
- Drizzle migrations checked in and runnable against Vercel Postgres locally, on preview, and in prod.
- Seed script that produces a fully demonstrable platform on `npm run seed`.
- Error boundaries, loading UI, and empty states everywhere, in Glint's voice.
- Audit logging on money and security actions.
- Accessible: WCAG AA contrast (the lemon-on-carbon and white-on-carbon combinations pass; verify), keyboard navigation, focus states, semantic HTML, alt text on all imagery.
- PWA installable with manifest, service worker, offline shell for the technician queue view (they may be in a basement car park with poor signal, so the technician workflow should degrade gracefully).
- `README.md` covering local setup, env vars, migrations, seeding, and the Vercel deploy path.
- No `console.log` left in shipped code paths; use a real logger.

---

## 10. Build order (phases, do not jump ahead)

1. **Foundation.** Repo, Next.js + TypeScript + Tailwind (dark, brand tokens), Drizzle wired to Vercel Postgres, Auth.js, `CLAUDE.md`, `AGENTS.md`, the `memory/` scaffold with `INDEX.md`, the build-time subagents, `.env.example`, README. Prove the stack runs and deploys to a Vercel preview before building features.
2. **Data + seed.** Full Drizzle schema, migrations, seed script with the four personas, two sites, technicians, and dated bookings.
3. **Auth + roles.** Sign-up/in, RBAC middleware, role-aware routing and layouts.
4. **Customer core.** Home/next-wash, vehicles, scheduling, subscription/plan, wash history, ratings.
5. **Payments.** PayFast integration behind the `PaymentProvider` interface: once-off checkout, recurring subscription setup, ITN webhook with signature/host/amount validation and idempotent processing, reconciliation records. Test with PayFast sandbox credentials.
6. **Technician core.** Site queue, per-wash checklist workflow, completion photos, key management, notifications firing on "done" (DB-logged for v1).
7. **Ops + partner.** Admin cross-site dashboard, escalations, mystery-shopper, developer-partner reconciliation view.
8. **Polish.** PWA, imagery via Magnific/Freepik MCP, empty/loading/error states, accessibility pass.

At the end of each phase, run the relevant subagent review (brand, schema, voice, security) and fix findings before moving on.

---

Begin with Phase 1. Before writing feature code, confirm the stack runs end to end and deploys to a Vercel preview. Read `CLAUDE.md` at the start of every subsequent session.
