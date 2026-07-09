// PayFast implementation of PaymentProvider. Server-only: the signature is
// built with the merchant passphrase and must never reach the client.
// All env access is lazy (inside functions) so the app builds without
// PayFast credentials — mirrors the pattern in src/db/index.ts.
import { createHash } from "crypto";
import { resolve4 } from "dns/promises";
import { z } from "zod";
import type {
  CheckoutFields,
  ItnVerification,
  OnceOffCheckoutInput,
  PaymentProvider,
  SubscriptionCheckoutInput,
  VerifyItnInput,
} from "./provider";

// Hosts PayFast sends ITNs from. Their IPs are resolved at verify time.
const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

function config() {
  const sandbox = process.env.PAYFAST_SANDBOX === "true";
  const base = sandbox
    ? "https://sandbox.payfast.co.za"
    : "https://www.payfast.co.za";
  return {
    sandbox,
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? "",
    passphrase: process.env.PAYFAST_PASSPHRASE ?? "",
    processUrl: `${base}/eng/process`,
    validateUrl: `${base}/eng/query/validate`,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}

// PayFast spec: PHP-style urlencode — spaces as "+", uppercase hex,
// and !'()* percent-encoded.
function pfEncode(value: string): string {
  return pfEncodeRaw(value.trim());
}

// Same encoding without trimming — ITN verification must reproduce the
// posted values byte-for-byte, exactly as PayFast signed them.
function pfEncodeRaw(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
    );
}

// MD5 signature over the urlencoded non-empty params, in the given order,
// with the passphrase appended when one is configured.
function signature(
  pairs: Array<[string, string]>,
  passphrase: string
): string {
  const parts = pairs
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v)}`);
  let str = parts.join("&");
  if (passphrase !== "") str += `&passphrase=${pfEncode(passphrase)}`;
  return createHash("md5").update(str).digest("hex");
}

function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Fields must be signed in PayFast's documented field order, which is the
// order they are declared here.
function baseFields(
  cfg: ReturnType<typeof config>,
  input: OnceOffCheckoutInput
): Array<[string, string]> {
  return [
    ["merchant_id", cfg.merchantId],
    ["merchant_key", cfg.merchantKey],
    ["return_url", `${cfg.appUrl}/pay/return`],
    ["cancel_url", `${cfg.appUrl}/pay/cancel`],
    ["notify_url", `${cfg.appUrl}/api/payments/itn`],
    ["name_first", input.customerName ?? ""],
    ["email_address", input.customerEmail ?? ""],
    ["m_payment_id", input.paymentId],
    ["amount", centsToAmount(input.amountCents)],
    ["item_name", input.itemName],
  ];
}

function toCheckout(
  cfg: ReturnType<typeof config>,
  pairs: Array<[string, string]>
): CheckoutFields {
  const nonEmpty = pairs.filter(([, v]) => v !== "");
  const fields = Object.fromEntries(nonEmpty);
  fields.signature = signature(pairs, cfg.passphrase);
  return { processUrl: cfg.processUrl, fields };
}

const rawItnSchema = z.record(z.string(), z.string());

const itnFieldsSchema = z.object({
  m_payment_id: z.string().optional(),
  pf_payment_id: z.string().optional(),
  payment_status: z.string().optional(),
  amount_gross: z.string().optional(),
  token: z.string().optional(),
  payment_method: z.string().optional(),
});

export function parseItnBody(rawBody: string): Record<string, string> {
  const params = new URLSearchParams(rawBody);
  const data: Record<string, string> = {};
  for (const [key, value] of params.entries()) data[key] = value;
  return rawItnSchema.parse(data);
}

// (a) Rebuild the signature from the posted params, in posted order,
// excluding `signature` itself. Unlike the checkout signature, the ITN
// signature covers EVERY posted field — including empty ones — with values
// reproduced byte-for-byte (no trimming). This mirrors PayFast's reference
// implementation, which hashes all $_POST vars except `signature`.
function verifySignature(rawBody: string, passphrase: string): boolean {
  const params = new URLSearchParams(rawBody);
  const parts: string[] = [];
  let posted = "";
  for (const [key, value] of params.entries()) {
    if (key === "signature") posted = value;
    else parts.push(`${key}=${pfEncodeRaw(value)}`);
  }
  if (posted === "") return false;
  let str = parts.join("&");
  if (passphrase !== "") str += `&passphrase=${pfEncode(passphrase)}`;
  const computed = createHash("md5").update(str).digest("hex");
  return computed === posted.toLowerCase();
}

// (b) Source validation. On Vercel the TCP peer is a proxy, so the client IP
// comes from x-forwarded-for; we check it against DNS for the PayFast host
// list, and additionally confirm authenticity via a server-side POST-back of
// the exact payload to /eng/query/validate (PayFast replies "VALID").
// Either check passing counts as host-valid; both failing rejects the ITN.
async function verifySourceIp(sourceIp: string | null): Promise<boolean> {
  if (!sourceIp) return false;
  const lookups = await Promise.allSettled(
    PAYFAST_HOSTS.map((host) => resolve4(host))
  );
  const validIps = lookups.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );
  return validIps.includes(sourceIp);
}

async function verifyByPostback(
  validateUrl: string,
  rawBody: string
): Promise<boolean> {
  // PayFast's validate endpoint expects the received params WITHOUT the
  // signature field, re-encoded in posted order (reference implementation).
  const params = new URLSearchParams(rawBody);
  const body = [...params.entries()]
    .filter(([key]) => key !== "signature")
    .map(([key, value]) => `${key}=${pfEncodeRaw(value)}`)
    .join("&");
  try {
    const res = await fetch(validateUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const text = (await res.text()).trim();
    return res.ok && text.startsWith("VALID");
  } catch {
    return false;
  }
}

class PayfastProvider implements PaymentProvider {
  readonly name = "payfast";

  createOnceOffCheckout(input: OnceOffCheckoutInput): CheckoutFields {
    const cfg = config();
    return toCheckout(cfg, baseFields(cfg, input));
  }

  createSubscriptionCheckout(input: SubscriptionCheckoutInput): CheckoutFields {
    const cfg = config();
    const pairs = baseFields(cfg, input);
    // Recurring billing: monthly (frequency 3), indefinite (cycles 0).
    pairs.push(
      ["subscription_type", "1"],
      ["recurring_amount", centsToAmount(input.recurringAmountCents)],
      ["frequency", "3"],
      ["cycles", "0"]
    );
    return toCheckout(cfg, pairs);
  }

  async verifyItn(input: VerifyItnInput): Promise<ItnVerification> {
    const cfg = config();
    const data = parseItnBody(input.rawBody);
    const fields = itnFieldsSchema.parse(data);

    const signatureValid = verifySignature(input.rawBody, cfg.passphrase);

    const [ipValid, postbackValid] = await Promise.all([
      verifySourceIp(input.sourceIp),
      verifyByPostback(cfg.validateUrl, input.rawBody),
    ]);
    const hostValid = ipValid || postbackValid;

    // (c) amount_gross must match the originating payments row to the cent.
    const grossCents =
      fields.amount_gross !== undefined
        ? Math.round(Number.parseFloat(fields.amount_gross) * 100)
        : NaN;
    const amountMatched =
      input.expectedAmountCents !== null &&
      Number.isFinite(grossCents) &&
      grossCents === input.expectedAmountCents;

    const complete = fields.payment_status === "COMPLETE";

    return {
      signatureValid,
      hostValid,
      amountMatched,
      processable: signatureValid && hostValid && amountMatched && complete,
      providerPaymentId: fields.pf_payment_id ?? null,
      merchantPaymentId: fields.m_payment_id ?? null,
      providerStatus: fields.payment_status ?? null,
      subscriptionToken: fields.token ?? null,
      method: fields.payment_method ?? null,
      data,
    };
  }
}

export const payfastProvider: PaymentProvider = new PayfastProvider();
