// Provider-agnostic payment contracts. PayFast is the first implementation;
// a second provider (e.g. Yoco) implements this same interface without any
// changes to the checkout pages or the webhook route shape.

export interface CheckoutFields {
  /** Absolute URL the browser form posts to. */
  processUrl: string;
  /** Signed key/value pairs rendered as hidden inputs, in order. */
  fields: Record<string, string>;
}

export interface OnceOffCheckoutInput {
  /** Our payments.id — round-trips through the provider as the merchant ref. */
  paymentId: string;
  amountCents: number;
  itemName: string;
  customerEmail?: string;
  customerName?: string;
}

export interface SubscriptionCheckoutInput extends OnceOffCheckoutInput {
  /** Amount billed each cycle; first charge is `amountCents`. */
  recurringAmountCents: number;
}

export interface VerifyItnInput {
  /** Raw urlencoded POST body, exactly as received. */
  rawBody: string;
  /** Client IP the webhook arrived from (x-forwarded-for on Vercel). */
  sourceIp: string | null;
  /** amount on the originating payments row; null if the row was not found. */
  expectedAmountCents: number | null;
}

export interface ItnVerification {
  signatureValid: boolean;
  hostValid: boolean;
  amountMatched: boolean;
  /** All three checks passed and the provider reports a completed payment. */
  processable: boolean;
  /** Provider-side payment reference (pf_payment_id for PayFast). */
  providerPaymentId: string | null;
  /** Our payments.id echoed back (m_payment_id for PayFast). */
  merchantPaymentId: string | null;
  /** Provider payment status string, e.g. "COMPLETE". */
  providerStatus: string | null;
  /** Recurring billing token, when the provider issued one. */
  subscriptionToken: string | null;
  /** Payment method reported by the provider, if any. */
  method: string | null;
  /** Parsed key/value payload for the append-only event log. */
  data: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: string;
  createOnceOffCheckout(input: OnceOffCheckoutInput): CheckoutFields;
  createSubscriptionCheckout(input: SubscriptionCheckoutInput): CheckoutFields;
  verifyItn(input: VerifyItnInput): Promise<ItnVerification>;
}
