# [FAS 2: DESIGN POLISH – ROSA/EUCALYPTUS TEMA]

**Status:** ✅ Klar  
**Startad:** 2025-02-11  
**Avslutad:** 2025-02-11  

---

## 📁 FILER ÄNDRADE

| Fil | Ändring |
|-----|--------|
| `src/index.css` | Ny färgpalett rosa/eucalyptus: primary rosa (330 81% 60%), secondary/accents emerald, gradients (--gradient-primary, --gradient-button, --gradient-hero, --gradient-card). Uppdaterat .dark, .gradient-button, .bg-gradient-premium. |
| `src/components/ui/button-variants.ts` | Ny variant `gradient` (rosa→emerald), default hover opacity. |
| `src/components/ui/sonner.tsx` | Borttagen next-themes-beroende; fast theme="light", toast med bg-card och shadow-card. |
| `src/components/settings/MatchingSettings.tsx` | Spara-knapp använder variant="gradient" i stället för hårdkodad rose-500. |
| `src/lib/motion.ts` | Ny fil: Framer Motion-presets (softSpring, gentleFade, countUp). |

---

## ✅ CHECKLISTA STATUS

- [x] **Analysera nuvarande tema** – Tema i `src/index.css` (CSS-variabler) och tailwind.config.ts.
- [x] **Uppdatera färgpalett** – Rosa som primary, eucalyptus/emerald som secondary och accent; bättre kontrast (foreground 220 13% 18%).
- [x] **Standardisera knappar** – Ny gradient-variant, primary använder CSS-variabler; MatchingSettings använder gradient.
- [x] **Badges/toasts** – Badge använder redan primary/secondary. Sonner använder card + shadow-card.
- [x] **Animationer** – Presets i `src/lib/motion.ts` (softSpring, gentleFade, countUp); befintliga keyframes oförändrade.

---

## DESIGNSPEC

- **Primär gradient:** `#F472B6 → #34D399` (header/cards).
- **Knappgradient:** `#EC4899 → #10B981`.
- **Bakgrund:** `#FDF2F8 → #F0FDF4`.
- **Typografi:** Playfair Display (rubriker), DM Sans (brödtext) – oförändrat i tailwind.

---

## 🚀 NÄSTA STEG

1. Manuell kontroll: kontrast (WCAG AA) på texter mot nya bakgrunder.
2. Fas 3: Live användarräknare (OnlineCountBar, inställningar, Supabase Presence/polling).

---

## ⚠️ RISKER/BLOCKERS

- Ingen. Om `next-themes` används någon annanstans kan Sonner behöva återkoppling till theme (dark/light) vid behov.
