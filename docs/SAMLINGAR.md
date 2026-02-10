# Samlingar – gruppchatt (MVP)

Så här sätter du upp och testar Samlingar efter att migrationerna är körda.

---

## 1. Aktivera Realtime för group_messages

För att meddelanden ska dyka upp direkt i gruppchatten (utan att ladda om) måste tabellen vara med i Realtime-publikationen.

### Alternativ A: Via migration (rekommenderat)

Migrationen `20260203100100_realtime_group_messages.sql` lägger redan till `group_messages` i Realtime. Kör:

```bash
npx supabase db push
```

### Alternativ B: Via Supabase Dashboard

1. Gå till Supabase Dashboard → ditt projekt.
2. **Database** → **Replication**.
3. Under **Realtime** – lägg till tabellen **`public.group_messages`** om den inte finns.

### Alternativ C: Via SQL

I **SQL Editor**:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
```

---

## 2. Testflöde

1. **Chatt** – Öppna Chatt-fliken (eller `/chat`).
2. **Samlingar** – Kontrollera att sektionen "Samlingar" syns överst med en **+**-knapp.
3. **Skapa samling** – Klicka +, ge gruppen ett namn, välj minst 2 mutual matches, klicka Skapa samling.
4. **Öppna gruppchatt** – Klicka på gruppen i listan.
5. **Skicka meddelanden** – Skriv och skicka; med Realtime ska nya meddelanden synas direkt.
6. **Lämna gruppen** – ⋯ → Lämna gruppen → bekräfta.

---

## 3. Fas 2 (ej implementerad)

Fas 2: gruppvideo, aktiviteter, AI-isbrytare för grupper, grupp-achievements. MVP är klart; Fas 2 bygger ovanpå.
