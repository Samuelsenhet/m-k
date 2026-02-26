# Mascot assets

PNG-filer som används av `<Mascot token="…" />` och `getMascotTokenForState()`.

## Varför visas inte mascotbilderna från Figma?

Appen laddar mascot från **filer i denna mapp** (`public/mascot/`). Just nu finns här inga PNG-filer – därför visas den neutrala texten "MÄÄK" (placeholder) i t.ex. MatchesErrorState och EmptyStateWithMascot. Figma är bara designkällan; bilderna måste **exporteras från Figma och sparas hit** med rätt filnamn.

**Så får du visa Figma-mascoten:**

1. Öppna [Figma MÄÄK-MASCOT](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT).
2. Följ [FIGMA_EXPORT_SPEC.md](../docs/mascot-workspace/FIGMA_EXPORT_SPEC.md) (PNG, transparent bakgrund, 2x/3x, rätt filnamn).
3. Spara de exporterade PNG-filerna i **denna mapp** (`public/mascot/`) med exakt de filnamn som står i tabellen nedan.
4. Ladda om appen – då används Figma-mascoten automatiskt.

**Status:** Gamla mascot-PNG:er är borttagna. Tills du lagt in nya från Figma visar appen placeholdern "MÄÄK".

## Källa – Figma MÄÄK-MASCOT

**Alla mascot-visuals kommer från Figma:**

- [Figma MÄÄK-MASCOT](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT)

Exportregler, token-mappning och checklista finns i **mascot-workspace**:

- [docs/mascot-workspace/README.md](../docs/mascot-workspace/README.md) – översikt och Figma-länk
- [docs/mascot-workspace/FIGMA_EXPORT_SPEC.md](../docs/mascot-workspace/FIGMA_EXPORT_SPEC.md) – hur man exporterar (transparent bakgrund, aspect ratio, filnamn)
- [docs/mascot-workspace/TOKEN_MAP.md](../docs/mascot-workspace/TOKEN_MAP.md) – Figma frame → app-token
- [docs/mascot-workspace/ASSET_CHECKLIST.md](../docs/mascot-workspace/ASSET_CHECKLIST.md) – vilka filer som ska finnas här

Exportera enligt spec och spara filerna i denna mapp med namnen nedan.

## Förväntade filer (9 PNG + valfritt sprite)

| Fil | Token |
|-----|--------|
| mascot_calm_idle.png | Calm / Idle |
| mascot_ai_listening.png | AI lyssnar |
| mascot_ai_thinking.png | AI tänker |
| mascot_ai_open_hand.png | AI svarar, landing hero |
| mascot_ai_tiny_sparkle.png | Firande (AI) |
| mascot_waiting_tea.png | Väntfas / loading |
| mascot_planting_seed.png | Tomma matchningar / samlingar |
| mascot_practicing_mirror.png | Inga chattar / profil tom |
| mascot_lighting_lantern.png | Första match-firande |

**Valfritt:** `mascot_sheet_ai.png` – sprite med de fyra AI-poses. Byggs med:

```bash
npm run mascot:sprite
```

(scriptet läser de fyra `mascot_ai_*.png` och sätter ihop dem. Kör efter att du ersatt AI-PNGs från Figma.)

## Läge: en bild per token

Varje token har en egen fil, t.ex. `/mascot/mascot_calm_idle.png`. Appen använder solid bakgrund (`MASCOT_BG_STYLE`) runt mascot-containern.

## Composite / sprite (AI)

AI-tokens kan antingen använda enskilda PNGs eller en gemensam sprite `mascot_sheet_ai.png`. Mappning i `src/lib/mascot/index.ts` (`MASCOT_COMPOSITE_MAP`).
