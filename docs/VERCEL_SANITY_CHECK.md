# Vercel sanity check – Production / Preview

Använd denna lista när du dubbelkollar env vars i **Vercel → Project → Settings → Environment Variables**.

---

## Production & Preview (main app)

| Variabel | Förväntat | Kontroll |
|----------|-----------|----------|
| `VITE_SUPABASE_URL` | Din riktiga Supabase-URL | Satt, börjar med `https://` och `.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Din anon/public key | Satt, lång sträng (JWT-format) |
| `VITE_ENABLE_COLLECTIONS` | **utelämnad** eller **`true`** | Samlingar (gruppchatt). Sätt till `false` endast om du vill stänga av funktionen. |
| `VITE_ENABLE_GROUP_VIDEO` | **utelämnad** eller **`true`** | Kemi-Check / gruppvideo. Sätt till `false` för att stänga av utan redeploy. |

- **Twilio**: Använd aldrig Twilio-secrets i client env (VITE_*). Endast i Supabase Edge Functions eller server-side.
- Efter ändring: **Redeploy** så att nya värden används.

---

## Gamla eller onödiga variabler

- **`NEXT_PUBLIC_*`** – Detta projekt använder **`VITE_*`**. Ta bort gamla `NEXT_PUBLIC_*` om de finns (de används inte av Vite-appen).
- **Gamla Supabase-nycklar** – Kontrollera att du inte har kvar äldre namn (t.ex. `SUPABASE_ANON_KEY` utan `VITE_`-prefix). Appen läser bara `VITE_SUPABASE_URL` och `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## Snabbcheck

1. Öppna Vercel → ditt projekt → **Settings** → **Environment Variables**.
2. Supabase-variablerna ska vara satta för prod (så att inloggning och data fungerar).
4. Spara och **Redeploy** om du ändrat något.
