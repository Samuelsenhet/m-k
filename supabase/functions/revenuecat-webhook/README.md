# revenuecat-webhook

Receives RevenueCat webhook events and syncs subscription state into the `subscriptions` table.

## Auth

RevenueCat sends `Authorization: Bearer <secret>` where `<secret>` is the value
you configure in the RevenueCat dashboard. The function compares it in constant
time to `REVENUECAT_WEBHOOK_AUTH`.

## Deploy

```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH=<random-long-secret>
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

`--no-verify-jwt` is required because RevenueCat is not a Supabase auth client —
we do our own bearer check.

## RevenueCat configuration

- **Webhook URL:** `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
- **Authorization header:** `Bearer <REVENUECAT_WEBHOOK_AUTH>`
- **Event types:** all (function filters internally)

## Managed entitlements

Two entitlements must exist in the RevenueCat dashboard:

- `basic` — Basic weekly (69 kr), granted by `maak_basic_weekly`
- `premium` — Premium monthly (199 kr), granted by `maak_premium_monthly`

If an event carries the `premium` entitlement it wins over `basic`.

## Event mapping

| RC event                                                     | `plan_type`     | `status`    | `expires_at`              |
| ------------------------------------------------------------ | --------------- | ----------- | ------------------------- |
| INITIAL_PURCHASE / RENEWAL / PRODUCT_CHANGE / UNCANCELLATION | `basic`/`premium` (from entitlement) | `active`    | event.expiration_at_ms    |
| NON_RENEWING_PURCHASE                                        | `basic`/`premium`                    | `active`    | event.expiration_at_ms    |
| CANCELLATION (auto-renew off — access continues)             | `basic`/`premium`                    | `cancelled` | event.expiration_at_ms    |
| EXPIRATION / REFUND / SUBSCRIPTION_PAUSED                    | `free`          | `expired`   | event.expiration_at_ms    |
| BILLING_ISSUE / TRANSFER / TEST / other                      | (no-op)         | (no-op)     | (no-op, 200 ack)          |

## Requirements

- `app_user_id` (or `original_app_user_id`) must be a Supabase `auth.users.id`
  (UUID). The mobile client calls `Purchases.logIn(session.user.id)` once the
  user is authenticated to guarantee this.
- `subscriptions` table must allow `plan_type='basic'` and `plan_type='premium'`
  — see migration `20260405130000_subscriptions_plus_tier.sql`.
- RevenueCat project: **`proj42d9a702`**
  (https://app.revenuecat.com/projects/proj42d9a702).

## Idempotency

The function upserts on `user_id` (the table has `UNIQUE(user_id)`), so retried
webhooks are safe.
