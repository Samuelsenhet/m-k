# Launch: 401 + group_members – operativ checklista

Gör i **exakt denna ordning**. Inget annat.

---

## 🔴 BLOCKER: 401 från match-daily / match-status

Frontend visar **session: yes** och **user: …** men Edge Function returnerar 401.  
➡️ Det är **Supabase config mismatch**, inte React.

**Om användaren ser "Tjänsten svarar inte just nu" eller (i dev) "Edge Function returned a non-2xx status code"** → följ STEG 1–4 nedan. När projekt och Secrets är rätt och funktionerna är omdeployade försvinner felet.

---

## Environment alignment (401 + ändringar syns inte)

Om 401 kvarstår eller **ändringar i appen inte syns** efter deploy är det nästan alltid att frontend och Edge Functions inte använder samma Supabase-projekt, eller att cache (PWA/Vite) serverar gammal kod.

### Verifiering (30 sekunder)

Kör i terminalen:

```bash
supabase projects list
supabase status
```

- **supabase status** ska visa länkat projekt med ref **jappgthiyedycwhttpcu**. Om annan ref eller "not linked" → Edge Functions deployas till fel projekt → 401.
- I webbläsarkonsolen: `import.meta.env.VITE_SUPABASE_URL` ska vara `https://jappgthiyedycwhttpcu.supabase.co` (samma ref). Se till att **.env** använder samma projekt (se STEG 1 nedan).

### Operativ fix (5 minuter)

1. **supabase unlink** (tar bort fel länk)
2. **supabase link --project-ref jappgthiyedycwhttpcu**
3. **npm run edge:fix-401** (deployar match-daily + match-status)
4. Starta om dev: stoppa servern, sedan **npm run dev**

Alternativ: kör **npm run edge:align-and-deploy** för att (vid behov) länka rätt projekt och deploya. Första gången du länkar kan du behöva köra `supabase link --project-ref jappgthiyedycwhttpcu` manuellt om scriptet frågar efter lösenord.

### Om ändringar fortfarande inte syns (cache)

- **PWA:** DevTools → Application → Service Workers → Unregister. Sedan hård laddning (Cmd+Shift+R).
- **Vite:** `rm -rf node_modules/.vite` sedan `npm run dev`.

---

### ✅ STEG 1 — Samma projekt i .env

Öppna **.env**:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Gå till **Supabase → Settings → API**.  
URL och **anon key** ska vara från **samma projekt** som du använder i dashboard.

🚨 **Vanligaste felet:** keys kopierade från ett annat projekt.

---

### ✅ STEG 2 — Edge Function Secrets

**Supabase → Edge Functions → Secrets**

Måste finnas:

| Secret            | Värde |
|------------------|--------|
| `SUPABASE_URL`   | `https://<projekt-ref>.supabase.co` (samma som i .env) |
| `SUPABASE_ANON_KEY` | Samma anon key som i .env |

Om något saknas eller är fel:

1. Uppdatera secret(s)
2. **Redeploya** functionen (match-daily / match-status)

**Fel: "supabaseUrl is required"**

Om du ser detta fel (i Invoke-svar eller i loggar) betyder det att `SUPABASE_URL` (och eventuellt `SUPABASE_ANON_KEY`) inte är satta i Edge Function-miljön.

- **Åtgärd:** Supabase Dashboard → Edge Functions → **Secrets** → sätt `SUPABASE_URL` och `SUPABASE_ANON_KEY` (samma värden som i projektets .env), sedan **Redeploy** match-daily och match-status.
- **En-kommando-fix (rekommenderat):** Kör från projektroten:

```bash
npm run edge:fix-401
```

Scriptet deployar match-daily och match-status. SUPABASE_URL och SUPABASE_ANON_KEY injiceras automatiskt av Supabase i Edge Functions – behöver inte sättas manuellt. Kräver att projektet är länkat: `npx supabase login` och `npx supabase link --project-ref jappgthiyedycwhttpcu`.

**Alternativt manuellt via CLI:** `supabase secrets set SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key>` sedan `supabase functions deploy match-daily` och `supabase functions deploy match-status`.

**Lokal körning:** Kopiera `supabase/.env.local.example` till `supabase/.env.local`, fyll i värdena från Dashboard → Settings → API, och kör `supabase functions serve --env-file ./supabase/.env.local`. För att sätta secrets i produktion: `supabase secrets set --env-file ./supabase/.env.local` innan deploy.

---

### ✅ STEG 3 — Token skickas (Network)

I webbläsaren: **DevTools → Network** → trigga match-daily.

Välj request **match-daily** → **Headers**.

Du ska se:

```http
Authorization: Bearer eyJhbGciOi...
```

Om **Authorization** saknas ➡️ felet är i frontend (t.ex. `getSession()` inte klar innan invoke).  
Om headern finns men du fortfarande får 401 ➡️ **STEG 1 eller 2** (fel projekt eller fel secrets).

---

### ✅ STEG 4 — Testa Edge Function direkt (avgörande)

**Alternativ A – Skript (rekommenderat)**  
Lägg i **.env** antingen `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Settings → API → service_role) eller `SUPABASE_TEST_EMAIL` + `SUPABASE_TEST_PASSWORD`. Kör sedan:

```bash
npm run test:edge-match-daily
```

**200** → backend ok. **401** → kolla STEG 1 + 2.

**Alternativ B – Manuellt i Dashboard**  
**Supabase → Edge Functions → match-daily → Invoke**

- **Header:** exakt en header med **namn** `Authorization` och **värde** `Bearer <token>` (t.ex. `Bearer eyJhbGciOiJIUzI1...`). Använd inte en header som heter "Bearer".
- **Body:** `{}` om du använder användarens token, eller `{"user_id": "<uuid>"}` om du använder service_role.  
  ⚠️ `user_id` ska vara en **användares UUID** (t.ex. från Authentication → Users eller Table Editor → profiles → kolumn `id`). Använd **inte** projekt-ref (jappgthiyedycwhttpcu) som user_id.

Token: antingen (1) användarens `access_token` från webbläsaren (DevTools → Application → Local Storage → Supabase session), eller (2) **service_role key** från Dashboard → Settings → API → service_role (Reveal).

**Resultat:**

| Svar | Betydelse |
|------|------------|
| **200** | Backend OK – då är felet i hur frontend anropar (URL/env). |
| **401** | Secrets fel – kolla STEG 2 (SUPABASE_URL + SUPABASE_ANON_KEY). |
| **500** | DB / RLS / tabell – kolla Edge Function-loggarna. |

När STEG 1–4 är rätt ➡️ **401 är borta.**

---

## 🟠 BONUS: group_members 500

Detta är **tabell eller RLS**, inte Edge Function.

I **Supabase → SQL Editor**:

```sql
SELECT * FROM group_members LIMIT 1;
```

- **Error** ➡️ tabellen saknas. Kör migrationen som skapar `group_members`.
- **OK** ➡️ RLS saknar SELECT-policy för din användare. Lägg till policy så inloggad användare får läsa sina rader.

---

## 🟡 MASCOT-BILDER (visuellt)

Vit bakgrund / fel crop kommer från **PNG-assets**, inte från logik.

**Krav för in-app mascot:**

- Exportera som **PNG**
- **Transparent background**
- **Tight crop** (ingen extra padding)

I koden (redan åtgärdat om du följt tidigare steg):

- Mascot-omslag: `aspect-square`, img: `object-contain w-full h-full`, wrapper kan ha `bg-transparent` så det inte blir vit box.

---

## 🟢 Ordning du jobbar

1. **Testa Edge Function manuellt med token** (STEG 4) → skriv resultatet (200 / 401 / 500).
2. **Kolla att .env = samma projekt** (STEG 1) → bekräfta.
3. **Kolla Secrets i Edge Functions** (STEG 2) → bekräfta.

När dessa 3 är rätt ➡️ 401 är löst.

Frontend är inte trasig – du är i **backend-config-läge**. Sista 10 % är wiring.
