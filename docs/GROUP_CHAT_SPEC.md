# Gruppchatt – implementationsplan

Steg-för-steg spec för att bygga gruppchatt i MÄÄK (Supabase + React). Befintlig 1-mot-1-chatt lämnas oförändrad; gruppchatt byggs bredvid.

---

## 1. Databas (Supabase-migrationer)

### 1.1 Tabeller

**`group_chats`**
- `id` UUID PK
- `name` TEXT (t.ex. "Fika-grupp")
- `created_by` UUID REFERENCES profiles(id)
- `created_at`, `updated_at` timestamptz

**`group_chat_members`**
- `id` UUID PK
- `group_chat_id` UUID REFERENCES group_chats(id) ON DELETE CASCADE
- `user_id` UUID REFERENCES profiles(id) ON DELETE CASCADE
- `joined_at` timestamptz
- UNIQUE(group_chat_id, user_id)

**`group_chat_messages`**
- `id` UUID PK
- `group_chat_id` UUID REFERENCES group_chats(id) ON DELETE CASCADE
- `sender_id` UUID REFERENCES profiles(id) ON DELETE CASCADE
- `content` TEXT NOT NULL
- `created_at` timestamptz DEFAULT now()
- Index: (group_chat_id, created_at)

### 1.2 RLS (Row Level Security)

- **group_chats**: Användare får SELECT om de finns i `group_chat_members` för den gruppen. INSERT om `created_by = auth.uid()`.
- **group_chat_members**: SELECT/INSERT om användaren är medlem eller skapare. DELETE endast för egen rad (lämna grupp).
- **group_chat_messages**: SELECT om användaren är medlem i gruppen. INSERT om användaren är medlem.

### 1.3 Realtime

- Aktivera Realtime för `group_chat_messages` (Supabase Dashboard → Database → Replication).
- I frontend: prenumeration på `group_chat_messages` med filter `group_chat_id=eq.{id}` (samma mönster som nuvarande `messages` + `match_id`).

---

## 2. Backend / logik

- **Skapa grupp**: INSERT `group_chats` + INSERT för varje medlem i `group_chat_members`. Anropas från frontend (t.ex. "Skapa grupp" och välj 2+ matchningar).
- **Lista grupper**: SELECT från `group_chats` JOIN `group_chat_members` WHERE `user_id = auth.uid()`, sorterat på senaste aktivitet (t.ex. max `created_at` i `group_chat_messages`).
- **Meddelanden**: SELECT från `group_chat_messages` WHERE `group_chat_id = ?` ORDER BY `created_at`. INSERT vid skickat meddelande.
- Ingen Edge Function krävs för grundversionen; allt kan göras med Supabase client + RLS.

---

## 3. Rutter (React Router)

Lägg till i `App.tsx`:

- `GET /group-chat` → Lista grupper (grupplista).
- `GET /group-chat/:groupId` → En gruppchatt (konversationsvy).

Exempel:

```tsx
<Route path="/group-chat" element={<GroupChatList />} />
<Route path="/group-chat/:groupId" element={<GroupChatWindow />} />
```

---

## 4. UI-komponenter och sidor

### 4.1 Grupplista (`GroupChatList.tsx`)

- Sidtitel t.ex. "Gruppchatt".
- Lista grupper användaren är medlem i (hämtas från `group_chats` + `group_chat_members`).
- Varje rad: gruppnamn, senaste meddelande eller "Inga meddelanden än", tid, ev. avatarer för medlemmar.
- Knapp: "Skapa grupp" → öppnar flöde för att välja matchningar och namnge gruppen.
- Klick på rad → navigera till `/group-chat/:groupId`.

### 4.2 Gruppchatt-vy (`GroupChatWindow.tsx`)

- Header: gruppnamn, tillbaka-knapp, ev. menyn (lämna grupp, notifieringar).
- Meddelandelista (samma visuella mönster som nuvarande ChatWindow): användarnamn + innehåll, tid, lässtatus ej nödvändig i v1.
- Input: skriv meddelande + skicka. INSERT i `group_chat_messages` + Realtime så andra ser meddelandet direkt.
- Preferera samma MÄÄK-stil (färger, typografi) som 1-mot-1-chatten.

### 4.3 Skapa grupp (modal eller egen sida)

- Steg 1: Välj 2–5 matchningar (checkboxar från `matches` där status = mutual).
- Steg 2: Ange gruppnamn (valfritt, t.ex. "Fika-grupp").
- Bekräfta → skapa `group_chats` + `group_chat_members` (skaparen + valda matchningar), sedan redirect till `/group-chat/:groupId`.

### 4.4 Navigation

- I BottomNav eller under Chat: lägg till länk/flik "Gruppchatt" → `/group-chat`.
- Alternativt: under Chat-sidan en tab eller knapp "Grupper" som går till `/group-chat`.

---

## 5. Implementationsordning (rekommenderad)

| Steg | Uppgift | Resultat |
|------|---------|----------|
| 1 | Ny migration: skapa `group_chats`, `group_chat_members`, `group_chat_messages` + RLS + index | Tabeller och säkerhet på plats |
| 2 | Aktivera Realtime för `group_chat_messages` i Supabase | Live-uppdateringar |
| 3 | Route + tom/minimal `GroupChatList` som hämtar användarens grupper | Sidan "Gruppchatt" med lista (ev. tom) |
| 4 | `GroupChatWindow` med hämtning av meddelanden + input som INSERT | Kan skriva och läsa i en grupp |
| 5 | Realtime-prenumeration i `GroupChatWindow` | Nya meddelanden dyker upp direkt |
| 6 | Flöde "Skapa grupp" (välj matchningar, namn, skapa grupp + medlemmar) | Användare kan skapa grupper |
| 7 | Länk från Chat eller BottomNav till `/group-chat` | Enkel åtkomst till gruppchatt |
| 8 | Justera listan (senaste meddelande, tid, avatarer) och ev. "Lämna grupp" | Polerad UX |

---

## 6. Filer att skapa/ändra (översikt)

- **Ny:** `supabase/migrations/YYYYMMDD_add_group_chat_tables.sql`
- **Ny:** `src/pages/GroupChatList.tsx` (eller `src/pages/GroupChat.tsx` med lista + routing till grupp)
- **Ny:** `src/pages/GroupChatWindow.tsx` (eller `src/components/chat/GroupChatWindow.tsx`)
- **Ny:** `src/components/group-chat/CreateGroupModal.tsx` (eller inbäddat flöde på GroupChatList)
- **Ändra:** `src/App.tsx` – lägg till routes ovan
- **Ändra:** `src/components/navigation/BottomNav.tsx` (eller Chat-sidan) – länk till gruppchatt
- **Valfritt:** `src/hooks/useGroupChats.ts`, `useGroupChatMessages.ts` för att bryta ut data/logik

---

## 7. i18n

Lägg till t.ex. i `en.json` / `sv.json`:

- `groupChat.title` – "Gruppchatt"
- `groupChat.create` – "Skapa grupp"
- `groupChat.groupName` – "Gruppnamn"
- `groupChat.selectMatches` – "Välj matchningar (minst 2)"
- `groupChat.noGroups` – "Du har inga grupper än"
- `groupChat.leaveGroup` – "Lämna grupp"

---

När dessa steg är genomförda är den information som behövs för gruppchatt inlagd både i databas, backend, rutter och UI. Landningssidans punkt "Gruppchatt" motsvarar då en fungerande funktion.
