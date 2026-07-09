// Server-side price list. Amounts never come from the client.
export const CATALOG = {
  basic: {
    label: "Basic plan",
    description: "Two exterior washes a month at your site.",
    amountCents: 49900,
    recurring: true,
    plan: "basic",
  },
  premium: {
    label: "Premium plan",
    description: "Four washes a month, interior and exterior.",
    amountCents: 79900,
    recurring: true,
    plan: "premium",
  },
  once_off: {
    label: "Once-off wash",
    description: "A single exterior wash, no commitment.",
    amountCents: 18000,
    recurring: false,
    plan: null,
  },
} as const;

export type CatalogKey = keyof typeof CATALOG;

export function formatRands(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}
