export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    priceId: 'price_1SqdPMLGJ9uCQzbbjjy1HhbX',
    productId: 'prod_ToFvCqWdBIVMsi',
    price: 97,
    projects: 1,
  },
  pro: {
    name: 'Pro',
    priceId: 'price_1SqdQFLGJ9uCQzbbnShki2Vm',
    productId: 'prod_ToFwv9cb0NMmvp',
    price: 197,
    projects: 5,
  },
  business: {
    name: 'Business',
    priceId: 'price_1SqdQVLGJ9uCQzbbWpfug7RR',
    productId: 'prod_ToFws6yTdBBxgL',
    price: 397,
    projects: 10,
  },
  agencia: {
    name: 'Agência',
    priceId: 'price_1SqdQlLGJ9uCQzbbmB1kv6FT',
    productId: 'prod_ToFwdFNKLqedmz',
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
