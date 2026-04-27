# send-bulk-email Edge Function

Skickar ett bulk-utskick till användare baserat på en kampanj i `bulk_emails`. Hämtar mottagare från `profiles` och deras e-post från Auth; anropar sedan `send-email` för varje giltig e-postadress (placeholder-adresser @phone.maak.app hoppas över).

## Request (POST)

```json
{ "campaign_id": "uuid" }
```

## Flöde

1. Hämtar kampanjen från `bulk_emails` (template_id → mallnamn från `email_templates`).
2. Hämtar alla profiler (id, display_name).
3. För varje användare: hämtar e-post via `auth.getUserById`; skippar placeholder; anropar `send-email` med mall och `data: { user_name }`.
4. Uppdaterar kampanjen med `status: 'completed'`, `sent_at` och `results` (array med { email, success, error? }).

## Secrets

Samma som för `send-email` (Resend). `SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` behövs.

## Filter

Kampanjens `filters` sparas i DB och används vid urval:

- **country** – om `filters.country` är satt (t.ex. `"SE"`, `"NO"`) hämtas endast profiler med `profiles.country` lika med det värdet. Kräver att `profiles` har kolumnen `country` (ISO 3166-1 alpha-2).
