# send-email Edge Function

Skickar e-post via [Resend](https://resend.com) för ärendehantering (rapporter, överklaganden) och bulk-utskick.

- **DB-mallar:** Om en mall med angivet `template`-namn finns i `email_templates` används den (med `last_used` uppdaterat). Annars används inbyggda mallar för `report_received`, `report_resolved`, `appeal_received`, `appeal_decision`.
- **Variabler:** Alla nycklar i `data` ersätts i ämne och body som `{{key}}`.
- **Tracking:** En loggrad skapas i `email_logs` med status `pending` innan utskick; en tracking-pixel (anropar `track-email`) injiceras i HTML. Efter utskick uppdateras loggen till `sent` eller `failed`.

## Secrets (Supabase Dashboard → Edge Functions → send-email → Secrets)

| Secret | Obligatorisk | Beskrivning |
|--------|-------------|-------------|
| `RESEND_API_KEY` | Ja | API-nyckel från resend.com (Dashboard → API Keys). |
| `MAIL_FROM` | Nej | Avsändaradress, t.ex. `Määk <no-reply@maakapp.se>`. Default: `Määk <no-reply@maakapp.se>`. |
| `SUPABASE_URL` | Ja* | Projekt-URL (finns ofta redan). Behövs för `email_logs` och uppdatering av `reports.email_sent` / `appeals.email_sent`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ja* | Service role key (finns ofta redan). Krävs för att skriva till `email_logs` och uppdatera rapport/överklagande. |

\* Supabase sätter ofta dessa automatiskt för Edge Functions; om `email_logs` eller `email_sent` inte uppdateras, lägg till dem manuellt.

## Request body (POST)

```json
{
  "to": "user@example.com",
  "template": "report_received",
  "data": { "report_id": "uuid", "appeal_id": "uuid", "status": "resolved" },
  "language": "sv"
}
```

- **to:** Valfri för `report_resolved` och `appeal_decision` – mottagare hämtas då från rapporten/överklagandet via service role. Obligatorisk för `report_received` och `appeal_received`.
- **template:** `report_received` | `report_resolved` | `appeal_received` | `appeal_decision`
- **data:** Variabler som ersätts i mall (t.ex. `{{report_id}}`, `{{status}}`). För `report_resolved` krävs `report_id` (+ `status`); för `appeal_decision` krävs `appeal_id` (+ `status`).
- **language:** `sv` | `en` (default `sv`).

E-post skickas inte till placeholder-adresser (`@phone.maak.app`); då returneras `{ success: true, skipped: true, reason: "no_email_or_placeholder" }`.

## Resend-setup

1. Registrera på [resend.com](https://resend.com).
2. Verifiera domän (t.ex. `maakapp.se`) under Domains.
3. Skapa API Key och lägg in som `RESEND_API_KEY` i Supabase Secrets.
4. Lokal test: `supabase functions serve send-email --env-file .env` med `RESEND_API_KEY` i `.env`.
