-- Extend subscriptions.plan_type allowed values to cover the mobile IAP tiers
-- written by the RevenueCat webhook.
--
-- Original CHECK allowed only ('free', 'premium', 'vip'). The mobile IAP
-- products introduce two paid tiers:
--   * basic   — Basic weekly (69 kr)
--   * premium — Premium monthly (199 kr)
-- 'plus' is kept as a legacy alias (web + older migrations reference it).

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('free', 'basic', 'plus', 'premium', 'vip'));
