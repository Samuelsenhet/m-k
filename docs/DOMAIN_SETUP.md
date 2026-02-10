# Domänkonfiguration för MÄÄK

Så här kopplar du dina domäner till Vercel och Supabase.

---

## 1. Domäner

| Domän | Användning |
|-------|------------|
| **maakapp.se** | Primär (rekommenderas – utan åäö) |
| **määkapp.com** | IDN: `xn--mkapp-graa.com` |
| **määkapp.se** | IDN: `xn--mkapp-graa.se` |

Rekommendation: använd **maakapp.se** som primär.

---

## 2. Koppla maakapp.se till Vercel

### Steg 1: Lägg till domän i Vercel

1. Gå till [vercel.com/dashboard](https://vercel.com/dashboard)
2. Välj projektet (t.ex. **m-k**)
3. **Settings** → **Domains**
4. Klicka **Add** och skriv `maakapp.se`
5. Klicka **Add**
6. (Valfritt) Lägg även till `www.maakapp.se` – Vercel föreslår ofta att **www** redirectar till **@**

### Steg 2: DNS i Loopia

Vercel har uppdaterat sina rekommenderade DNS-värden. Använd de som **Vercel visar** under Settings → Domains för ditt projekt (klicka på domänen). Vanligtvis:

1. Logga in på [Loopia.se](https://loopia.se)
2. **Mina domäner** → **maakapp.se** → **DNS-inställningar**
3. Ta bort gamla A/CNAME för @ och www om de pekade någon annanstans
4. Lägg till **de värden Vercel anger** för maakapp.se. Rekommenderade (2025) är t.ex.:

| TYP   | HOSTNAMN | VÄRDE (exempel – dubbelkolla i Vercel) | TTL  |
|-------|----------|----------------------------------------|------|
| A     | @        | **216.198.79.1**                        | 3600 |
| CNAME | www      | **&lt;ditt-projekt&gt;.vercel-dns-017.com** (kopiera från Vercel) | 3600 |

- **A @:** Vercel rekommenderar nu `216.198.79.1` (äldre `76.76.21.21` fungerar fortfarande men nytt är att föredra).
- **CNAME www:** Värdet är **projektspecifikt** – kopiera exakt från Vercel (Settings → Domains → maakapp.se / www.maakapp.se), t.ex. `60a1859842c4f661.vercel-dns-017.com.`

### Steg 3: SSL

Vercel ger automatiskt Let's Encrypt SSL. Verifiering tar oftast 2–15 minuter.

---

## 3. Supabase Auth – redirect-URL:er

När appen körs på maakapp.se måste Supabase känna till domänen:

1. Gå till [Supabase Dashboard](https://supabase.com) → ditt projekt
2. **Authentication** → **URL Configuration**
3. Sätt:
   - **Site URL:** `https://maakapp.se`
   - **Redirect URLs:** `https://maakapp.se/**`
4. Spara

Behåll gärna även din Vercel-URL i Redirect URLs om du använder den (t.ex. preview).

---

## 4. Miljövariabler (valfritt)

Om appen behöver veta sin egen URL (t.ex. för e-postlänkar eller delning):

- I **Vercel**: Settings → Environment Variables  
  Lägg till för **Production**:
  - `VITE_APP_URL` = `https://maakapp.se`

- I **.env** lokalt (endast om du bygger för production-URL):
  - `VITE_APP_URL=https://maakapp.se`

`.env.example` innehåller inte detta; det behövs bara om du använder `VITE_APP_URL` i koden.

---

## 5. PWA-manifest

Manifestet i `vite.config.ts` använder `scope: "/"` och `start_url: "/"` så att PWA fungerar på **både** vercel.app och maakapp.se. Ingen ändring behövs när du lägger till domänen.

---

## 6. Flera domäner (valfritt)

För **määkapp.com** och **määkapp.se**:

- **Alternativ A – Redirect till maakapp.se**  
  I Loopia för varje domän: A-record för @ till `216.198.79.1`, CNAME www till det värde Vercel visar för projektet.  
  I Vercel: lägg till domänerna under **Domains** och sätt **Redirect** till `https://maakapp.se`.

- **Alternativ B – Samma app på alla**  
  Lägg till domänerna i Vercel utan redirect. Uppdatera Supabase **Redirect URLs** till att inkludera varje domän, t.ex. `https://määkapp.se/**`.

---

## 7. Snabbchecklista

- [ ] Domän tillagd i Vercel (Settings → Domains)
- [ ] DNS i Loopia: **A @ → 216.198.79.1**, **CNAME www** → värdet från Vercel (t.ex. `…vercel-dns-017.com`)
- [ ] Supabase: Site URL = `https://maakapp.se`, Redirect URLs inkluderar `https://maakapp.se/**`
- [ ] Vänta 5–15 min (upp till 24 h vid DNS-propagation)
- [ ] I Vercel: klicka **Refresh** på domänen – status ska bli giltig
- [ ] Testa: https://maakapp.se laddar, HTTPS (grönt lås), inloggning fungerar

### DNS-koll

```bash
nslookup maakapp.se
# eller
dig maakapp.se
```

---

## 8. DNS via Loopia API och säker lagring

Du kan ändra DNS via Loopia API istället för manuellt i Loopia Kundzon.

### Säkra inloggningsuppgifter

- **Skapa API-användare:** Loopia Kundzon → **Kontoinställningar** → **LoopiaAPI**. Använd ett eget användarnamn/lösenord för API (inte din vanliga inloggning).
- **Spara aldrig lösenord i kod eller git.** Använd endast:
  - **Lokalt:** filen `.env` i projektroten (den är redan i `.gitignore`). Lägg till `LOOPIA_API_USER` och `LOOPIA_API_PASSWORD`; se `.env.example`.
  - **Körning:** `export LOOPIA_API_USER=... LOOPIA_API_PASSWORD=...` innan du kör scriptet, eller använd `node --env-file=.env scripts/loopia-dns.js ...` (Node 20+).
- Committa aldrig `.env` eller filer som innehåller API-nycklar.

### Script i projektet

I repot finns **scripts/loopia-dns.js** som anropar Loopia API (XML-RPC) för maakapp.se:

```bash
# Lista nuvarande DNS-records (rot + www)
node scripts/loopia-dns.js list

# Sätt A @ och CNAME www till Vercels rekommenderade värden
node scripts/loopia-dns.js set-vercel
```

Scriptet läser `LOOPIA_API_USER` och `LOOPIA_API_PASSWORD` från miljön (eller från `.env` om du har `dotenv` installerat och laddar det). Uppdatera `VERCEL_CNAME_VALUE` i scriptet om Vercel visar ett annat CNAME-värde för www under Settings → Domains.

---

## 9. Referens – Vercel vs Netlify

| Tjänst   | A-record (@)   | CNAME (www)              |
|----------|-----------------|---------------------------|
| Vercel (ny) | **216.198.79.1** | Projektspesifikt (t.ex. …vercel-dns-017.com) – se Vercel Dashboard |
| Vercel (gammal) | 76.76.21.21  | cname.vercel-dns.com (fungerar fortfarande) |
| Netlify  | 75.2.60.5       | &lt;site-name&gt;.netlify.app |

**Vercel:** Använd alltid de värden som visas under **Settings → Domains** för ditt projekt; CNAME för www är unikt per projekt.

Detta projekt är konfigurerat för **Vercel**; se `docs/DEPLOY.md` och `docs/VERCEL_SETUP.md`.

---

*Loopia API: [support.loopia.com/wiki/loopiaapi](https://support.loopia.com/wiki/loopiaapi).*
