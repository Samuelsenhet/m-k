# Launch blockers & Go / No-Go checklist

Brutal “är vi redo att släppa?”-check. Alla blocker måste vara lösta innan release.

---

## Version och mål

- **Version:** 1.0.0 (sätt i `package.json` och `src/config/version.ts` innan release.)
- **Mål:** MÄÄK – personlighetsbaserad matchning, dagliga matchningar, AI-isbrytare och Kemi-Check (video).

---

## Blockers (måste fixas)

### BLOCKER 1: Edge Function auth (401 på match-daily)

**Symptom:** Console visar `401 Unauthorized`, `Edge Function returned non-2xx`, `Failed to fetch matches`.

**Orsak:** JWT når inte Edge Function korrekt, eller token är ogiltig/utgången.

**Åtgärd:**

- [ ] **401-test i appen:** Kör 401-testet på `/launch-checklist` (vara inloggad). Vid 200/202 är Blocker 1 OK i appen; vid 401, följ Dashboard-stegen nedan.
- [ ] Supabase Dashboard → Edge Functions → `match-daily` → Logs: vid 401 ska du se `match-daily: auth failed` (tillagt i koden). Bekräfta att anropet når funktionen.
- [ ] Kontrollera att klienten skickar header: `Authorization: Bearer <access_token>`. (`useMatches.ts` gör redan detta.)
- [ ] Kontrollera att `SUPABASE_URL` och `SUPABASE_ANON_KEY` i Edge Function-miljön (Supabase Dashboard → Project Settings → Edge Functions) är **samma projekt** som frontend använder. Fel projekt → JWT valideras fel → 401.
- [ ] Testa: logga ut, logga in igen, öppna Matchningar. Om 401 kvarstår efter refresh: dubbelkolla att anon key i Vercel/.env matchar projektet där funktionen körs.

**När 401 är borta:** match-daily svarar 200 (eller 202 vid WAITING). Då är Blocker 1 löst.

**Fix 401 – steg för steg:**

1. Öppna **Supabase Dashboard** och välj det projekt som frontend använder (samma som i din `.env`: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`).
2. Gå till **Project Settings** (kugghjulet) → **API**. Kopiera **Project URL** och **anon public** (API Key).
3. Gå till **Edge Functions** → **match-status** (eller **match-daily**) → **Settings** / **Secrets**. Sätt (eller uppdatera):
   - `SUPABASE_URL` = Project URL från steg 2
   - `SUPABASE_ANON_KEY` = anon public key från steg 2
4. Upprepa för **match-daily** om den har egna secrets. Många projekt sätter dessa automatiskt; om 401 kvarstår har funktionerna ofta fel värden (t.ex. annat projekt).
5. Logga ut i appen, logga in igen, öppna Matchningar. Kontrollera i Network att anrop till `match-status` och `match-daily` ger **200** eller **202**.

---

### BLOCKER 2: Ärlig felhantering (ingen falsk trygghet)

**Krav:** När backend svarar 401/5xx ska användaren se tydligt fel + möjlighet att försöka igen, inte en glad tom-state.

**Åtgärd (genomförd i kod):**

- [ ] **Matches:** Vid `error` från `useMatches` visas nu en dedikerad skärm: “Vi har problem att hämta matchningar just nu” + meddelande + knapp “Försök igen”. Inget lyckat tomt tillstånd när det egentligen är fel.
- [ ] **Chat / Samlingar:** Om du har liknande anrop (t.ex. Edge Functions som kan ge 401) ska även där tydlig error state + retry finnas. Kontrollera manuellt.

---

### BLOCKER 3: Demo ska inte vara aktiv i produktion

**Status:** Redan hårt avstängd.

- `src/config/supabase.ts`: `isDemoEnabled = (VITE_ENABLE_DEMO === "true")`. I `PROD` kastas fel om demo är på.
- I produktion: sätt **aldrig** `VITE_ENABLE_DEMO=true` i Vercel. Låt variabeln vara osatt eller `false`.

**Valfri hård rensning (efter launch):** Om du senare vill ta bort all demo-kod helt, kan följande tas bort eller stubbas:

- Routes: `/demo-seed`, `/demo-samlingar` (i `App.tsx` och `AppWithoutSupabase`).
- Sidor: `src/pages/DemoSeed.tsx`, `src/pages/DemoGroupChat.tsx`.
- Nav: i `BottomNav.tsx` tas “Demo”-länken bort när `isDemoEnabled` är false (redan villkorsstyrd).
- Config: `VITE_ENABLE_DEMO` och `isDemoEnabled` i `src/config/supabase.ts` (om du tar bort demo helt).
- Dokumentation: `docs/DEMO.md`, `docs/DEPLOY_DEMO.md` (referenser efter behov).

Tills dess räcker det att demo är av (env) och att inga stub-routes leder användare till demo i prod.

---

## Go / No-Go checklist (signera innan release)

Kryssa av när varje punkt är verifierad.

- [ ] **Auth:** Registrering och inloggning fungerar. E-post/telefon verifiering fungerar.
- [ ] **Matches:** match-daily svarar 200 (eller 202 WAITING). Inga 401 i konsolen. UI visar antingen matchningar, väntfas eller tydligt fel + retry.
- [ ] **Chat:** 1:1-chatt fungerar. Inga tysta fel som visas som “tomt”.
- [ ] **Samlingar:** Skapa grupp, chatta, lämna, systemmeddelanden. Inga tysta fel.
- [ ] **Felhantering:** Vid backend-fel (401/5xx) visas tydlig felmeddelande och retry där det är implementerat (minst Matches).
- [ ] **Demo:** `VITE_ENABLE_DEMO` är inte satt till `true` i produktion. Demo-routes nås inte av vanliga användare.
- [ ] **CI:** GitHub Actions Supabase-deploy (project ref + secrets) är konfigurerad så att pipeline inte faller på `--project-ref`.

När alla punkter är kryssade och du är nöjd med test: **Go.**

**Sign-off (fylla i innan release):**

- Version: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- Datum: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- Jag har gått igenom blockerna och Go/No-Go-checklistan ovan. Alla kriterier är uppfyllda.
- Namn/signatur: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Edge Function-verifiering (Supabase Dashboard)

Gör denna kontroll innan release. Alla punkter ska vara OK.

1. **Dashboard → Edge Functions**
   - [ ] `match-daily` är deployad (senaste version).
   - [ ] Öppna `match-daily` → **Logs**. Vid 401 ska loggen visa `match-daily: auth failed` (bekräftar att anrop når funktionen).

2. **Dashboard → Project Settings → Edge Functions**
   - [ ] **SUPABASE_URL** och **SUPABASE_ANON_KEY** (eller motsvarande) är satta och tillhör **samma projekt** som frontend (samma som `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` i Vercel).

3. **Secrets per funktion**
   - [ ] `match-daily`: kräver inga egna secrets (använder projektets JWT).
   - [ ] `twilio-send-otp` / `twilio-verify-otp`: Twilio-secrets satta enligt respektive README.
   - [ ] Övriga funktioner (t.ex. `generate-icebreakers`, `send-email`): secrets satta om de används.

4. **401-test i appen**
   - [ ] Logga in i appen → gå till Matchningar. Öppna DevTools → Network.
   - [ ] Anrop till `match-daily` ska ge **200** eller **202** (inte 401). Vid 401: dubbelkolla anon key och att klienten skickar `Authorization: Bearer <token>`.

När alla rutor är kryssade är Edge Function-verifieringen klar.

---

## Snabbreferens

| Problem | Var kolla |
|--------|-----------|
| 401 match-daily | Supabase Edge Function Logs; env SUPABASE_URL/ANON_KEY för samma projekt; klient Authorization header |
| UI visar “allt ok” vid fel | Matches: dedikerad error-skrärm. Övriga sidor: kontrollera error state + retry |
| Demo i prod | Vercel env: `VITE_ENABLE_DEMO` ej true. Config: kastar redan i prod om demo på |
