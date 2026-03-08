# Mascot assets

PNG-filer som används av `<Mascot token="…" />` och `getMascotTokenForState()`.

## Läge: en bild per token (nu)

Varje token har en egen fil, t.ex. `/mascot/mascot_calm_idle.png`.

## Läge: composite / sprite (flera poses i en bild)

**AI-mascoterna använder en sprite:** `mascot_sheet_ai.png` (4 poses: listening, thinking, open_hand, tiny_sparkle). Bygg med:

```bash
npm run mascot:sprite
```

Scriptet läser de fyra `mascot_ai_*.png` och sätter ihop dem till en horisontell sprite. Övriga tokens använder en bild per fil. För egen composite: lägg fil i `public/mascot/` och konfigurera `MASCOT_COMPOSITE_MAP` i `src/lib/mascot/index.ts` (sheet, columns, index).

## Token → fil (en-per-token)

| Token | Användning |
|-------|------------|
| `mascot_ai_listening` | AI lyssnar |
| `mascot_ai_open_hand` | AI svarar, landing hero |
| `mascot_ai_thinking` | AI tänker, landing problem |
| `mascot_ai_tiny_sparkle` | Första match-firande |
| `mascot_calm_idle` | Home idle, empty matches, no chats |
| `mascot_lighting_lantern` | Firande |
| `mascot_planting_seed` | Samlingar tom |
| `mascot_practicing_mirror` | Profil tom |
| `mascot_waiting_tea` | Väntfas |

**Nuvarande källa:** De 9 separata mascot-bilderna (screenshots 20.43–20.46 från 2026-02-18) är kopierade till token-namn. Mappning (om du vill byta):

| Token | Källa (tid) |
|-------|-------------|
| mascot_ai_listening | 20.43.55 |
| mascot_ai_open_hand | 20.44.11 |
| mascot_ai_thinking | 20.44.19 |
| mascot_ai_tiny_sparkle | 20.44.24 |
| mascot_calm_idle | 20.44.58 |
| mascot_lighting_lantern | 20.45.09 |
| mascot_planting_seed | 20.45.19 |
| mascot_practicing_mirror | 20.45.41 |
| mascot_waiting_tea | 20.46.00 |

Byt ut en PNG i `public/mascot/` om en pose ska mappas annorlunda. Kör sedan `npm run mascot:sprite` om du ändrat någon av de fyra AI-bilderna.

**Rena illustrationer (utan text i botten):** Kör `npm run mascot:clean` – scriptet klipper bort nedre ~18 % av varje bild (där etiketterna "Calm", "Listening" osv. satt). Därefter: `npm run mascot:sprite`.
