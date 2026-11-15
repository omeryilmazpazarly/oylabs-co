/**
 * Self-serve app plans sold from the App Builder landing page. Monthly, no setup fee;
 * the done-for-you setup is an optional one-time add-on. Amounts are sent to Stripe
 * as price_data, so changing one here is all it takes.
 */

export type AppPlanId = 'app-starter' | 'app-growth' | 'app-pro';

export interface AppPlan {
  id: AppPlanId;
  name: string;
  monthlyUsd: number;
  blurb: string;
}

export const APP_PLANS: AppPlan[] = [
  { id: 'app-starter', name: 'Starter', monthlyUsd: 49, blurb: 'Android app, four layouts, dashboard and push campaigns.' },
  { id: 'app-growth', name: 'Growth', monthlyUsd: 79, blurb: 'Android and iPhone, plus automatic order and back-in-stock notifications.' },
  { id: 'app-pro', name: 'Pro', monthlyUsd: 129, blurb: 'Everything in Growth, plus Instagram reels, Judge.me reviews and targeted notifications.' },
];

export const SETUP_ADDON_USD = 299;

export const isAppPlanId = (v: unknown): v is AppPlanId => typeof v === 'string' && APP_PLANS.some((p) => p.id === v);
export const appPlanById = (id: string | null | undefined): AppPlan | undefined => APP_PLANS.find((p) => p.id === id);
