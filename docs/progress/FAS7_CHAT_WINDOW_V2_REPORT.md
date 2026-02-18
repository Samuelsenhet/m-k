# FAS 7 – Chat Window V2 – Rapport

**Datum:** 2025-02-15  
**Status:** ✅ Klar

---

## Status

Chat-fönstret är migrerat till V2-designsystem. Alla nya komponenter ligger i `ui-v2/chat/`. Samma dataflöde (messages-hook, sendMessage, selectedMatch) används; ingen ändring av routing eller state.

---

## Filer ändrade / tillagda

### Nya komponenter (ui-v2/chat/)

| Fil | Beskrivning |
|-----|-------------|
| `ChatBubbleV2.tsx` | Bubbel med variant own/them/system, read state (Check/CheckCheck), token-styling |
| `ChatInputBarV2.tsx` | Auto-resize textarea, quick actions (AI, bild, röst), Skicka-knapp |
| `ChatHeaderV2.tsx` | Tillbaka, AvatarWithRing, namn + verified, StatusBadge (valfri), video-knapp, rightSlot |
| `ChatEmptyStateV2.tsx` | MaakMascot, "Säg hej 👋", AI-CTA, icebreaker-knappar |
| `index.ts` | Export av chat-komponenter |

### Migrerad

| Fil | Ändring |
|-----|---------|
| `src/components/chat/ChatWindow.tsx` | Använder ChatBubbleV2, ChatInputBarV2, ChatHeaderV2, ChatEmptyStateV2; MessageBubble borttagen; handleInputChange borttagen (ersatt av inline onChange) |

### Övrigt

- `src/components/ui-v2/index.ts` – export av chat-komponenter tillagd (om inte redan där)

---

## Checklista

- [x] ChatBubble own/them/system
- [x] Read state indikator (Check / CheckCheck)
- [x] Header med AvatarWithRing + video-knapp
- [x] Input bar med quick actions (AI, bild, röst)
- [x] Empty state med MaakMascot
- [x] Token-baserad styling (primary, card, elevation, radius)
- [x] Ingen regression (typecheck + lint ok)

---

## Tekniska ändringar

- **ChatBubbleV2:** `message: { id, content, created_at, is_own, read_at?, is_system? }`, `variant` own | them | system. Read state: `read_at` → CheckCheck, annars Check för eget.
- **ChatInputBarV2:** `value`/`onChange`/`onSubmit`, `onImageClick`/`onVoiceClick`/`onAIClick`, `sendLabel`, `sending`, `placeholder`, `disabled`. Enter skickar, Shift+Enter radbryt.
- **ChatHeaderV2:** `onBack`, `avatarSrc`, `displayName`, `verified`, `online`, `showVideoButton`, `onVideoClick`, valfritt `status`, `rightSlot` (t.ex. dropdown).
- **ChatEmptyStateV2:** `icebreakers`, `onIcebreakerClick`, `onAIClick`, `aiLabel`.
- **ChatWindow:** Ingen ny datalogik; samma hooks och handlers. Toolbar (Paperclip, Video, Mic, Sparkles, Brain) kan tas bort i en senare städning om ni vill att alla actions bara ska vara i input-baren.

---

## Frågor / beslut

- **Toolbar ovanför meddelanden:** Kvar tills vidare. Kan tas bort om ni vill att alla actions endast ska sitta i ChatInputBarV2.
- **Presence:** ChatHeaderV2 har `online`-prop (t.ex. `true`) för framtida per-användare presence; ingen implementation än.

---

## Nästa steg (enligt er ordning)

**FAS 8 – Matchning V2**

- BestMatchCard med riktig data  
- Passa / Chatta / Se profil-flow  
- MatchCelebration-modal  

Därefter: Profile V2 → Landing V2 → VideoCall V2.

---

**Filosofi-guard:** Ingen like, swipe, score. Chatt är primär handling. ✅
