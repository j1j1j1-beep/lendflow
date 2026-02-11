import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for import convenience */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const STRIPE_PRICES = {
  get license() { return process.env.STRIPE_LICENSE_PRICE_ID ?? ""; },
  get monthly() { return process.env.STRIPE_MONTHLY_PRICE_ID ?? ""; },
};

export const STRIPE_BIO_PRICES = {
  get license() { return process.env.STRIPE_BIO_LICENSE_PRICE_ID ?? ""; },
  get monthly() { return process.env.STRIPE_BIO_MONTHLY_PRICE_ID ?? ""; },
};

export const MAX_SEATS = 25;
