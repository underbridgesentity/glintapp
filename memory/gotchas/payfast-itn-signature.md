---
id: payfast-itn-signature
created: 2026-07-09
last-updated: 2026-07-09
session: payfast-sandbox-validation
author: agent
status: active
supersedes: none
---

# PayFast ITN signature covers ALL posted fields — including empty ones

Checkout signing excludes empty fields (documented), but the ITN signature is
computed by PayFast over every posted param except `signature`, in posted
order, byte-for-byte (no trimming), with `custom_str1..5`/`custom_int1..5`
usually empty. Reusing the checkout signer for ITN verification silently
rejected every real ITN (route logs and returns 200 by design, so PayFast
showed "Success" while nothing processed). Also: the `/eng/query/validate`
postback must exclude the `signature` param.

## Why
The two directions have different signing rules. Symptom is invisible:
sandbox says delivered/success, our route says 200, no payment completes.
Diagnose via payment_events outcomes or absence of the payment_received
email. Fixed in src/lib/payments/payfast.ts (verifySignature/verifyByPostback,
pfEncodeRaw). Validated end-to-end against the real sandbox on production.

## Change log
- 2026-07-09 — created after live sandbox round-trip failed then passed (agent)
