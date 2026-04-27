# match-status

Edge Function som returnerar användarens match-status (journey_phase, time_remaining, delivered_today, next_reset_time).

## Test i Supabase Dashboard

1. Öppna **Edge Functions** → **match-status** → fliken **Test**.
2. Välj **Role: service role** (längst ner).
3. I **Request Body** – viktigt: nyckeln ska heta exakt **`user_id`**, värdet ska vara din användar-UUID:
   ```json
   { "user_id": "a8f8de2f-21ff-4baa-94b4-423b6fca2af1" }
   ```
   Ersätt `a8f8de2f-21ff-4baa-94b4-423b6fca2af1` med ett riktigt User UID från **Authentication → Users**.
   - Rätt: `{ "user_id": "<uuid>" }`
   - Fel: `{ "<uuid>": "Functions" }` (ger 401).
4. Klicka **Send Request**.

Alternativt kan du skicka **Query Parameter**: nyckel `user_id`, värde `<din-uuid>`.

Utan giltigt `user_id` får du 400. Med inloggad användare (Bearer user JWT) används användarens eget id om `user_id` utelämnas.
