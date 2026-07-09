// Plan pricing in cents. Payment wiring lands in a later phase.
export const PLAN_PRICING = {
  basic: 45000,
  premium: 75000,
  fleet: 35000,
} as const;

export const PLAN_LABELS: Record<keyof typeof PLAN_PRICING, string> = {
  basic: "Basic",
  premium: "Premium",
  fleet: "Fleet",
};

export function formatRands(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}
