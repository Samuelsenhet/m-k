# Supabase telefoninloggning + Twilio – produktionschecklista

Denna guide beskriver vad som krävs för att **webb** och **mobil** ska kunna skapa konto / logga in med SMS-OTP.

## Viktigt: vilken kod väg används?

| Plattform | Flöde | Implementation |
|-----------|--------|----------------|
| Webb (`src/hooks/usePhoneAuth.ts`) | `supabase.auth.signInWithOtp({ phone })` → `verifyOtp({ phone, token, type: "sms" })` | Supabase **inbyggda** Phone Auth |
| Mobil (`apps/mobile/hooks/usePhoneAuth.ts`) | Samma API | Supabase **inbyggda** Phone Auth |

**Edge Functions** `twilio-send-otp` och `twilio-verify-otp` anropar Twilio Verify API direkt och kräver egna secrets. De används **inte** av inloggningsskärmarna i appen idag (inga `functions.invoke('twilio-…')` i klientkoden), men ska deployas med secrets om ni vill behålla dem för test, framtida flöden eller manuell felsökning.

---

## 1. Obligatoriskt: Supabase Dashboard (det som gör att appen fungerar)

1. **Authentication → Providers → Phone**
   - Aktivera **Phone** provider.
   - Konfigurera **SMS-leverantör** enligt [Supabase Phone Login](https://supabase.com/docs/guides/auth/phone-login) – vanligast **Twilio** med:
     - Account SID  
     - Auth Token  
     - Messaging Service SID eller avsändarnummer (följ Supabase UI / aktuell dokumentation).

2. **CAPTCHA (vanlig fälla)**  
   Om Phone Auth kräver CAPTCHA i projektet men klienten inte skickar `captchaToken` får användare fel. Antingen:
   - stäng av CAPTCHA för Phone i Supabase (om policy tillåter), eller  
   - implementera captcha i klienten och skicka med i `signInWithOtp` (se Supabase-dokumentation).

3. **URL + nycklar i klienten**
   - **Webb:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (eller motsvarande anon-nyckel).  
   - **Expo:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (se `docs/EXPO_ENV.md`).

4. **Telefonformat**  
   Klienten formaterar svenska nummer till **E.164** (t.ex. `+46701234567`). Fel format ger valideringsfel från Supabase/Twilio.

5. **Test i produktion**  
   Skicka riktig SMS till minst ett nummer per miljö (staging + prod) innan lansering.

---

## 2. Twilio-konto (vid sidan av Supabase)

- Säkerställ att **SMS till era målländer** är tillåtna (Twilio geo-behörighet, ev. A2P/10DLC för USA).
- Övervaka **kostnad** och sätt **usage alerts** i Twilio.
- **Rate limiting** i Edge Function `twilio-send-otp` påverkar **inte** det inbyggda Supabase-flödet om ni bara använder Dashboard-providern – men samma Twilio-konto kan användas av båda om ni konfigurerar olika vägar.

---

## 3. Edge Functions `twilio-send-otp` / `twilio-verify-otp` (om ni deployar dem)

Sätt följande **secrets** för funktionerna (t.ex. `supabase secrets set …`):

| Secret | Används i |
|--------|-----------|
| `TWILIO_ACCOUNT_SID` | Båda |
| `TWILIO_AUTH_TOKEN` | Båda |
| `TWILIO_VERIFY_SERVICE_SID` | Båda (måste börja med `VA` – Twilio Verify Service) |
| `SUPABASE_URL` | `twilio-verify-otp` (för admin-klient) |
| `SUPABASE_SERVICE_ROLE_KEY` | `twilio-verify-otp` (**aldrig** i klienten) |
| `CORS_ORIGIN` | Valfri; standard `*` om ej satt |

Deploy:

```bash
supabase functions deploy twilio-send-otp
supabase functions deploy twilio-verify-otp
```

Verifiera i Twilio Console att **Verify**-tjänsten har **SMS**-kanal aktiverad för test/produktion.

---

## 4. Snabb felsökning

| Symtom | Trolig orsak |
|--------|----------------|
| "Phone provider is disabled" | Phone inte aktiverat i Dashboard |
| CAPTCHA-relaterat fel | CAPTCHA påslaget utan token i klient |
| SMS kommer inte fram | Fel Twilio-konfiguration i Supabase, geo/blockering, eller fel nummerformat |
| Edge Function 500 "Missing Twilio credentials" | Secrets inte satta för den funktionen |

---

## 5. Relaterade filer i repot

- `apps/mobile/hooks/usePhoneAuth.ts` – mobil OTP-flöde  
- `src/hooks/usePhoneAuth.ts` – webb OTP-flöde  
- `supabase/functions/twilio-send-otp/index.ts` – Twilio Verify: skicka SMS  
- `supabase/functions/twilio-verify-otp/index.ts` – Twilio Verify: kontrollera kod + session  
- `src/lib/supabase-test.ts` – nämner deploy av twilio-funktioner  

Uppdatera denna checklista om ni byter till att anropa Edge Functions från klienten istället för enbart `signInWithOtp`.
