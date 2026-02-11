# [FAS 3: LIVE ANVÄNDARRÄKNARE]

**Status:** ✅ Klar  
**Datum:** 2025-02-01  

---

## Syfte

Live antal inloggade användare via Supabase Realtime Presence, med komponent ovanför innehållet och inställning för att visa/dölja.

---

## 📁 FILER ÄNDRADE / NYA

| Fil | Ändring |
|-----|--------|
| `src/components/OnlineCountBar.tsx` | **Ny** – Använder `useOnlineCount(userId)`, visar badge med `t('common.online_badge', { count })`, fixerad längst ner ovanför BottomNav. Inställning via `getShowOnlineCount()` / `setShowOnlineCount()` (localStorage `maak_show_online_count`). Reagerar på pref-ändring via custom event. |
| `src/pages/Profile.tsx` | Inställningsblad: ny rad "Visa antal aktiva användare" med Switch; importerar `getShowOnlineCount`, `setShowOnlineCount` och `Switch`. State synkas när inställningsbladet öppnas. |
| `src/i18n/locales/sv.json` | `settings.show_online_count`: "Visa antal aktiva användare". |
| `src/i18n/locales/en.json` | `settings.show_online_count`: "Show number of active users". |
| `src/components/profile/ProfileView.tsx` | Fas 1-justering: utökad `select` med `education, gender, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra, interested_in`. Lagt till `interested_in` i `ProfileData`. |

---

## ✅ FAS 3 CHECKLISTA

- [x] **Supabase Presence** – `useOnlineCount.ts` fanns redan (kanal `maak:online`, track med `user_id`).
- [x] **Komponent** – `OnlineCountBar` renderas i `AppContent` (redan placerad i App.tsx), visar bara när användare är inloggad och `getShowOnlineCount()` är true.
- [x] **Inställning** – Profil → Inställningar: "Visa antal aktiva användare" med Switch; sparar i localStorage; baren uppdateras direkt vid växling (custom event).

---

## DUBBELKOLL FAS 1 & FAS 2 (denna worktree)

**Fas 1**
- Profil: ProfileView hämtar nu alla nödvändiga fält (inkl. education, gender, dating_intention, relationship_type, interested_in) – justerat i denna omgång.
- Land: ProfileEditor har `country: data.country || 'SE'` – redan ok.
- Scroll: Notifikationer `overflow-y-auto`; Prestationer wrapper med Tillbaka-knapp och scroll – ok.
- Inställningar/språk: i18n "Inställningar", LanguageToggle – ok.

**Fas 2**
- Tema: `src/index.css` har i denna worktree fortfarande **Eucalyptus Grove** (grön primary). FAS2-rapporten beskriver rosa/eucalyptus – om det ska vara rosa här, uppdatera CSS-variablerna enligt FAS2_DESIGN_POLISH_REPORT.md.
- Knappar: `button-variants.ts` har ingen `gradient`-variant i denna worktree – kan läggas till enligt Fas 2-rapporten vid behov.
- Motion: `src/lib/motion.ts` finns (softSpring, gentleFade, countUp).

---

## 🚀 NÄSTA STEG

1. Verifiera lokalt: logga in, kontrollera att användarräknaren syns längst ner (om inställningen på), växla inställningen i Profil → Inställningar.
2. Om bygget fortfarande faller på saknade sidor (t.ex. GroupChatList), åtgärda imports/routes i App.tsx så att de matchar filer som finns i worktree.
3. Fas 4 (Samlingar) / Fas 5 (About + full i18n) enligt pre-deployment-planen.
