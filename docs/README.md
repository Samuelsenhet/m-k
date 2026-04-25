# MÄÄK – Dokumentation

Översikt av dokumentationen i detta repo. Starta här för att hitta rätt fil.

---

## Snabbnavigering

| Behöver du… | Läs |
|-------------|-----|
| **Designsystem, färger, komponenter** | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| **State → vilken vy som visas** | [STATE_UI_MAP.md](STATE_UI_MAP.md) |
| **Aktuell launch-plan** | [LAUNCH_PLAN_2026-04-18.md](LAUNCH_PLAN_2026-04-18.md), [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), [LAUNCH_NEXT_STEPS.md](LAUNCH_NEXT_STEPS.md) |
| **401 / Edge Functions / Supabase** | [LAUNCH_401_CHECKLIST.md](LAUNCH_401_CHECKLIST.md) |
| **Sign-off vid release** | [LAUNCH_BLOCKERS_AND_GO_NO_GO.md](LAUNCH_BLOCKERS_AND_GO_NO_GO.md) |
| **Apple-svar / review-respons** | [APPLE_RESPONSE_2026-04-21.md](APPLE_RESPONSE_2026-04-21.md) |
| **Mascot (states, assets, Figma)** | [mascot-system.md](mascot-system.md), [mascot-workspace/](mascot-workspace/) |
| **PRD och krav** | [prd/PRD.md](prd/PRD.md), [prd/PRD_DESIGN_SYSTEM.md](prd/PRD_DESIGN_SYSTEM.md) |
| **Agent/uppdragsmetodik** | [MAAK_UNIVERSAL_AGENT_GUIDE.md](MAAK_UNIVERSAL_AGENT_GUIDE.md) |
| **Deploy (Vercel, domän)** | [DEPLOY.md](DEPLOY.md), [VERCEL_SETUP.md](VERCEL_SETUP.md), [DOMAIN_SETUP.md](DOMAIN_SETUP.md) |
| **iOS build (EAS)** | [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md), [EXPO_EAS_IOS.md](EXPO_EAS_IOS.md), [EAS_FIRST_IOS_BUILD.md](EAS_FIRST_IOS_BUILD.md), [CREATE_DEVELOPMENT_BUILD_EAS.md](CREATE_DEVELOPMENT_BUILD_EAS.md) |
| **Supabase deploy / Twilio** | [SUPABASE_DEPLOY.md](SUPABASE_DEPLOY.md), [SUPABASE_PHONE_TWILIO_CHECKLIST.md](SUPABASE_PHONE_TWILIO_CHECKLIST.md) |
| **Säkerhet / release-gate** | [SECURITY_RELEASE_GATE.md](SECURITY_RELEASE_GATE.md), [SECURITY_MAINTENANCE.md](SECURITY_MAINTENANCE.md), [SECURITY_REMEDIATION_PLAN.md](SECURITY_REMEDIATION_PLAN.md) |
| **Setup (ny utvecklare)** | [setup/SETUP_INSTRUCTIONS.md](setup/SETUP_INSTRUCTIONS.md), [PRE_DEV_CHECKLIST.md](PRE_DEV_CHECKLIST.md) |

---

## Kategorier

### Design och UI
- **DESIGN_SYSTEM.md** – Färgpalett, typografi, ui-v2-komponenter, mascot, FAS-status.
- **STATE_UI_MAP.md** – Vilken state visar vilken layout (Matches, Chat, Profile).
- **DESIGN_GUARDRAILS_CHECKLIST.md** – Designgränser och checklista.
- **LANDING_STORY_STRUCTURE.md** – Landing-struktur.
- **MOMENT_OF_DEPTH_SCRIPT.md** – Manus för moment-of-depth-flödet.

### Launch och release
- **LAUNCH_PLAN_2026-04-18.md** – Aktuell launch-plan (build 80).
- **LAUNCH_CHECKLIST.md** – Aktuell launch-checklista.
- **LAUNCH_NEXT_STEPS.md** – Nästa steg efter senaste build.
- **LAUNCH_401_CHECKLIST.md** – Operativ fix för 401 (match-daily/match-status), .env, secrets, group_members.
- **LAUNCH_BLOCKERS_AND_GO_NO_GO.md** – Blockers och go/no-go (sign-off för releaseansvarig).
- **APPLE_RESPONSE_2026-04-21.md** – Senaste svaret från App Store Review.

### Deploy och infra
- **DEPLOY.md**, **VERCEL_SETUP.md**, **DOMAIN_SETUP.md** – Deploy och domän.
- **SUPABASE_DEPLOY.md** – Supabase migrationer + edge functions.
- **SUPABASE_PHONE_TWILIO_CHECKLIST.md** – Telefon-OTP via Twilio.
- **VARDAR.md** – Operativa rutiner.

### iOS / Expo
- **IOS_EAS_BUILD.md** – iOS build på EAS.
- **EAS_FIRST_IOS_BUILD.md** – Första iOS-builden med EAS.
- **EXPO_EAS_IOS.md** – EAS-konfiguration för Expo iOS.
- **EXPO_ENV.md** – Env-vars i Expo.
- **EXPO_BROWNFIELD_MAAK.md** – Capacitor → Expo brownfield-migration.
- **EXPO_PORT_ROUTE_MATRIX.md** – Route-migrationsmatris.
- **EXPO_ROUTER_RESERVED_PATHS.md**, **EXPO_ROUTER_MIGRATE_FROM_REACT_NAVIGATION.md**, **EXPO_WEB_TO_RN_LAYOUT.md** – expo-router referensmaterial.
- **CREATE_DEVELOPMENT_BUILD_EAS.md** – Dev-client-build (för IAP-test).
- **REVENUECAT_IOS_INTEGRATION.md** – RevenueCat iOS-integration.

### Säkerhet
- **SECURITY_RELEASE_GATE.md** – Säkerhetsgrindar för release.
- **SECURITY_MAINTENANCE.md** – Löpande säkerhetsunderhåll.
- **SECURITY_REMEDIATION_PLAN.md** – Plan för säkerhetsåtgärder.

### PRD och krav
- **prd/PRD.md** – Huvud-PRD.
- **prd/PRD_DESIGN_SYSTEM.md** – Design-PRD (US-001–US-017).

### Features och spec
- **features/FEATURES.md** – Features-översikt.
- **SAMLINGAR.md**, **SAMLINGAR_UX_PRINCIPLES.md** – Samlingar (gruppchatt).
- **FAS10_SAMLINGAR_FULL_UX_SPEC.md** – Full UX-spec Samlingar.
- **GROUP_CHAT_SPEC.md** – Gruppchatt-spec.
- **CHAT_FEATURES_SPEC_MAP.md** – Chatt-features.

### Mascot
- **mascot-system.md** – Mascot-states, tokens, användning i appen.
- **mascot-workspace/** – README, TOKEN_MAP, FIGMA_EXPORT_SPEC, EXPRESSIONS_AND_SCENARIOS, ASSET_CHECKLIST.
- **mascot-workspace-backup/** – Källa för `npm run mascot:sync-from-backup`.

### Övrigt
- **MAAK_UNIVERSAL_AGENT_GUIDE.md** – Agent-guide (startup questions, faser, rapportering).
- **setup/SETUP_INSTRUCTIONS.md** – Instruktioner för ny utvecklare.
- **PRE_DEV_CHECKLIST.md** – Före utveckling (refereras från CONTRIBUTING.md).
- **design-assets/** – Referensfiler (MaakUnifiedDesignSystem.jsx, PNG:er, MaakMascotShowcase.html).
- **app-store-screenshots/** – App Store-screenshots.
