# Where the spec features are in the chat

This maps your spec (videomöten, Kemi-Check, AI-Wingman, icebreakers) to the actual chat UI and code.

---

## 🎥 Videomöten & "Kemi-Check"

### 4. Kemi-Check – Videomöte före träff (5–10 min)

| Where in chat | File | What you see |
|---------------|------|--------------|
| **Toolbar** (top of chat) | `src/components/chat/ChatWindow.tsx` ~480–488 | **Videochatt** button with tooltip "Kemi-Check – kort video för att testa kemi". Click → starts video call. |
| **Video call screen** | `src/components/chat/VideoChatWindow.tsx` | Header "Kemi-Check", subtitle "Snabbvideo 5–10 min", local/remote video, Mute/Camera/Share screen/PiP/End call. Icebreakers shown during call. |
| **Wiring** | `src/pages/Chat.tsx` | `onStartVideo={() => setVideoCallActive(true)}` → renders `VideoChatWindow`. |

- **Teknik:** Video is WebRTC-style in `VideoChatWindow.tsx` (no Daily.co in this repo).
- **Namn:** Uses `chat.kemiCheck` / `chat.kemiCheckSubtitle` / `chat.kemiCheckTooltip` (i18n).

---

### 5. AI-Wingman under/efter videomötet

| Where in chat | File | What you see |
|---------------|------|--------------|
| **Card after returning from video** | `src/components/chat/ChatWindow.tsx` ~644–668 | When `showPostVideoCard` is true: card with "Efter Kemi-Check – AI-förslag" (`chat.postVideoTitle`), loading then AI suggestion text, and "Stäng". |
| **Backend** | Same file ~239–272 | `useEffect` calls Edge Function `ai-assistant` with `body: { type: 'after_video', matchedUserId }` and shows `data.suggestion`. |

So: **after** the user ends the Kemi-Check, the chat shows the "Efter Kemi-Check – AI-förslag" card with AI summary/suggestions.

---

## 💬 Konversationsstartare & AI-Wingman

### 6. AI-Wingman för att boka videomöten (suggest Kemi-Check efter N meddelanden)

| Where in chat | File | What you see |
|---------------|------|--------------|
| **Card above messages** | `src/components/chat/ChatWindow.tsx` | When message count is between 10–20 and not dismissed: card with Video icon, title "Kemi-Check", text `t('chat.aiSuggestKemiCheck')` ("Verkar som ni har mycket gemensamt! Boka en Kemi-Check …"), and two buttons: **Starta Kemi-Check** (calls `onStartVideo()` and dismisses card) and **Stäng** (dismisses card). |
| **State** | Same file | `kemiCheckSuggestionDismissed` – card is hidden once dismissed or after user clicks "Starta Kemi-Check". Range: `KEMI_CHECK_SUGGESTION_MIN = 10`, `KEMI_CHECK_SUGGESTION_MAX = 20`. |

---

### 7. Rika konversationsstartare (personlighetsanpassade, kategorier)

| Where in chat | File | What you see |
|---------------|------|--------------|
| **Toolbar** | `ChatWindow.tsx` ~494–507, ~511–525 | **Isbrytare** and **AI-förslag** buttons. |
| **AI icebreakers sheet** | Same file ~528–624 | Bottom sheet: "AI-genererade isbrytare", text "Personliga konversationsstartare baserade på era profiler", **categories** (Blandad, Roligt, Djupt, Aktivitet, Komplimang) → `generateAIIcebreakers(category)`, list of suggestions, "Generera nya förslag". |
| **Empty chat** | Same file ~675–696 | When no messages and icebreakers exist: "Ny match! Välj en konversationsstartare eller skriv ditt eget meddelande" + clickable icebreaker buttons. |
| **Follow-up suggestions** | Same file ~441–444, ~784–885 | When `messages.length >= 3` and last message is from **them**: green **HelpCircle** button opens sheet "Förslag på svar" with AI-generated reply suggestions (`generate-followups` Edge Function). |

So you already have:
- Personlighetsanpassade isbrytare (AI + categories).
- Situationsbaserat: "Förslag på svar" efter 3+ meddelanden när motparten skickat senast.

---

## Quick reference – files

| Feature | Main file(s) |
|---------|----------------------|
| Chat layout, toolbar, messages, post-video card, icebreakers sheet, follow-up sheet | `src/components/chat/ChatWindow.tsx` |
| Kemi-Check video call UI | `src/components/chat/VideoChatWindow.tsx` |
| Chat page (match list, open chat, start video) | `src/pages/Chat.tsx` |
| All chat copy (Kemi-Check, icebreakers, AI, etc.) | `src/i18n/locales/sv.json` / `en.json` under `chat.*` |

---

## What’s missing in the chat (from your spec)

1. **Demo**  
   The demo chat (`/demo-seed` → Chatt tab) does not show toolbar (Videochatt, Isbrytare, AI-förslag), post-video card, Kemi-Check suggestion card, or follow-up button; it’s a simplified view. So those spec features are only visible in the **real** app chat (when logged in and in a conversation).
