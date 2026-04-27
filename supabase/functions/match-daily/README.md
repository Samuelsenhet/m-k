# match-daily

Edge Function som returnerar användarens dagliga matchningar (från pool).

## Test i Supabase Dashboard

1. Öppna **Edge Functions** → **match-daily** → fliken **Test**.
2. Välj **Role: service role** (längst ner).
3. I **Request Body** – nyckeln ska heta exakt **`user_id`**, värdet ska vara användar-UUID:
   ```json
   { "user_id": "a8f8de2f-21ff-4baa-94b4-423b6fca2af1", "page_size": 5 }
   ```
   (Rätt: `{ "user_id": "<uuid>" }`. Fel: `{ "<uuid>": "något" }`.)
   Ersätt med ett riktigt `user_id` från tabellen `auth.users` eller `profiles`.
4. Klicka **Send Request**.

Utan `user_id` i body får du `400 user_id required when using service role`. Med inloggad användare (Bearer user JWT) behövs inte service role – då används användarens eget id om `user_id` utelämnas.
