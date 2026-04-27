# ID Verification Webhook

This Edge Function receives webhooks from ID verification providers (e.g. **Onfido**, **Jumio**) and updates `profiles.id_verification_status` to `approved` or `rejected`.

## Env vars (Supabase Dashboard → Edge Functions → id-verification-webhook → Secrets)

| Variable | Required | Description |
|----------|----------|-------------|
| `ID_VERIFICATION_WEBHOOK_SECRET` | Recommended | Shared secret sent in `x-webhook-secret` (or provider signature header). If set, request is rejected when header doesn’t match. |
| `SUPABASE_URL` | Yes | Set by Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Set by Supabase. |

## Webhook URL

After deploy:

```text
https://<project-ref>.supabase.co/functions/v1/id-verification-webhook
```

Configure this URL in your provider’s dashboard (Onfido/Jumio) as the webhook endpoint.

## Supported payloads

### 1. Generic (any provider)

```json
{
  "user_id": "uuid-of-your-user",
  "status": "approved"
}
```

Or with applicant lookup (requires a row in `id_verification_applicants`):

```json
{
  "applicant_id": "provider-applicant-id",
  "provider": "onfido",
  "status": "approved"
}
```

### 2. Onfido

Uses [Onfido webhook payload](https://documentation.onfido.com/#webhooks). The function reads `payload.object.applicant_id` and `payload.object.result` (or `status`), maps `applicant_id` → `user_id` via `id_verification_applicants`, then sets `id_verification_status` to `approved` (result `clear`) or `rejected` (result `consider`).

- You must **create an applicant** in Onfido when the user starts verification (e.g. after upload in your app) and **insert** into `id_verification_applicants`:

  ```sql
  INSERT INTO public.id_verification_applicants (user_id, applicant_id, provider)
  VALUES ('<auth.users.id>', '<onfido_applicant_id>', 'onfido');
  ```

- In Onfido Dashboard → Webhooks, set the URL above and (optional) use the same value as `ID_VERIFICATION_WEBHOOK_SECRET` for signature verification.

### 3. Jumio

Simplified handling: `verificationStatus` → `approved`/`rejected`; if the payload includes `userId`, that is used as `user_id`. Otherwise use `scanReference` as `applicant_id` and ensure a row exists in `id_verification_applicants` for that provider/applicant and your `user_id`.

## Database

- **profiles**: `id_verification_status` is set to `approved` or `rejected`.
- **id_verification_applicants**: Maps provider `applicant_id` to your `user_id`. Create this table and RLS via `ONE_TIME_SETUP.sql` (section 8). When you integrate Onfido/Jumio SDK and create an applicant, insert a row here so the webhook can resolve `applicant_id` → `user_id`.

## Security

- Set `ID_VERIFICATION_WEBHOOK_SECRET` and validate it in the provider (e.g. Onfido signing secret). The function checks `x-webhook-secret`, `x-onfido-signature`, or `x-jumio-signature` against this secret when set.
- The function uses the **service role** to update `profiles`; do not expose the webhook URL or secret to the client.
