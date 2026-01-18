export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    priceId: 'price_1SqdRCLGJ9uCQzbbgiwSn822',
    productId: 'prod_ToFxrfIt6QwRe4',
    price: 97,
    projects: 1,
  },
  pro: {
    name: 'Pro',
    priceId: 'price_1SqdRELGJ9uCQzbbWq2e6YTd',
    productId: 'prod_ToFxRDlEJZ1bSB',
    price: 197,
    projects: 5,
  },
  business: {
    name: 'Business',
    priceId: 'price_1SqdRGLGJ9uCQzbbcGI4Rnxk',
    productId: 'prod_ToFxMqPNCLjWoh',
    price: 397,
    projects: 10,
  },
  agencia: {
    name: 'Agência',
    priceId: 'price_1SqdRHLGJ9uCQzbbvQRZe7pn',
    productId: 'prod_ToFxWKyCHGQMLh',
    price: 997,
    projects: -1, // ilimitado
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.productId === productId) {
      return key as PlanKey;
    }
  }
  return null;
}

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) {
      return key as PlanKey;
    }
  }
  return null;
}
