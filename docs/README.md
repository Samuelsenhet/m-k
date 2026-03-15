# MÄÄK – Dokumentation

Översikt av dokumentationen i detta repo. Starta här för att hitta rätt fil.

---

## Snabbnavigering

| Behöver du… | Läs |
| ----------- | --- |
| **Designsystem, färger, komponenter** | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| **State → vilken vy som visas** | [STATE_UI_MAP.md](STATE_UI_MAP.md) |
| **401 / Edge Functions / Supabase** | [LAUNCH_401_CHECKLIST.md](LAUNCH_401_CHECKLIST.md) |
| **Manuell verifiering (checklista)** | [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) |
| **Produktions-/launch-checklistor** | [PROD_LAUNCH_CHECKLIST.md](PROD_LAUNCH_CHECKLIST.md), [LAUNCH_BLOCKERS_AND_GO_NO_GO.md](LAUNCH_BLOCKERS_AND_GO_NO_GO.md) |
| **Mascot (states, assets, Figma)** | [mascot-system.md](mascot-system.md), [mascot-workspace/](mascot-workspace/) |
| **PRD och krav** | [prd/PRD.md](prd/PRD.md), [prd/PRD_DESIGN_SYSTEM.md](prd/PRD_DESIGN_SYSTEM.md) |
| **Agent/uppdragsmetodik** | [MAAK_UNIVERSAL_AGENT_GUIDE.md](MAAK_UNIVERSAL_AGENT_GUIDE.md) |
| **Demo-läge** | [DEMO.md](DEMO.md), [DEPLOY_DEMO.md](DEPLOY_DEMO.md) |
| **Deploy (Vercel, domän)** | [DEPLOY.md](DEPLOY.md), [VERCEL_SETUP.md](VERCEL_SETUP.md), [DOMAIN_SETUP.md](DOMAIN_SETUP.md) |
| **iOS build (EAS)** | [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md) |
| **Första iOS-build (EAS)** | [EAS_FIRST_IOS_BUILD.md](EAS_FIRST_IOS_BUILD.md) |
| **EAS Workflows + GitHub Actions** | [EAS_WORKFLOWS_AND_GITHUB_ACTIONS.md](EAS_WORKFLOWS_AND_GITHUB_ACTIONS.md) |
| **EAS-miljövariabler** | [EAS_ENVIRONMENT_VARIABLES.md](EAS_ENVIRONMENT_VARIABLES.md) |
| **Expo SDK-paket och versioner** | [EXPO_SDK_REFERENCE.md](EXPO_SDK_REFERENCE.md) |
| **Setup (ny utvecklare)** | [setup/SETUP_INSTRUCTIONS.md](setup/SETUP_INSTRUCTIONS.md), [PRE_DEV_CHECKLIST.md](PRE_DEV_CHECKLIST.md) |
| **Full pass före deploy** | [FULL_PASS_BEFORE_DEPLOY.md](FULL_PASS_BEFORE_DEPLOY.md) |

---

## Kategorier

### Design och UI

- **DESIGN_SYSTEM.md** – Färgpalett, typografi, ui-v2-komponenter, mascot, FAS-status.
- **STATE_UI_MAP.md** – Vilken state visar vilken layout (Matches, Chat, Profile).
- **DESIGN_GUARDRAILS_CHECKLIST.md** – Designgränser och checklista.
- **PAGES_REVIEW.md** – Sidgenomgång.
- **RELEASE_READINESS_DESIGN_EDITION.md**, **ANTI_TINDER_AUDIT_AND_RELEASE_READINESS.md** – Design/UX-release.

### Launch, deploy och 401

- **LAUNCH_401_CHECKLIST.md** – Operativ fix för 401 (match-daily/match-status), .env, secrets, group_members.
- **PROD_LAUNCH_CHECKLIST.md** – Produktionslaunch.
- **LAUNCH_BLOCKERS_AND_GO_NO_GO.md** – Blockers och go/no-go.
- **DEPLOY.md**, **VERCEL_SETUP.md**, **DOMAIN_SETUP.md** – Deploy och domän.
- **IOS_EAS_BUILD.md** – iOS build on EAS (Capacitor, custom config, local and remote steps).
- **EAS_FIRST_IOS_BUILD.md** – Första iOS-builden med EAS (prerequisites, login, köra build, installera).
- **EAS_ENVIRONMENT_VARIABLES.md** – Hantera miljövariabler för EAS Build (skapa, visibility, användning i byggen).
- **EXPO_SDK_REFERENCE.md** – Referens för Expo SDK-paket, versioner (Expo/RN/Node), pre-releases (canary/beta), Android/iOS-krav.

### Verifiering och kvalitet

- **VERIFICATION_CHECKLIST.md** – Manuell verifiering (US-017–US-029).
- **FULL_PASS_BEFORE_DEPLOY.md** – Smoke-test och deploy-ready.
- **PRE_DEV_CHECKLIST.md** – Före utveckling.

### PRD och krav

- **prd/PRD.md** – Huvud-PRD.
- **prd/PRD_DESIGN_SYSTEM.md** – Design-PRD (US-001–US-017).
- **PRD_REVIEW.md**, **PRD_REMAINING.md** – Status och kvarvarande.

### Features och spec

- **SAMLINGAR.md**, **SAMLINGAR_UX_PRINCIPLES.md** – Samlingar (gruppchatt).
- **FAS10_SAMLINGAR_FULL_UX_SPEC.md** – Full UX-spec Samlingar.
- **GROUP_CHAT_SPEC.md** – Gruppchatt-spec.
- **CHAT_FEATURES_SPEC_MAP.md** – Chatt-features.
- **LANDING_STORY_STRUCTURE.md** – Landing-struktur.
- **features/FEATURES.md** – Features-översikt.

### Mascot

- **mascot-system.md** – Mascot-states, tokens, användning i appen.
- **mascot-workspace/** – README, TOKEN_MAP, FIGMA_EXPORT_SPEC, EXPRESSIONS_AND_SCENARIOS, ASSET_CHECKLIST.

### Progress (FAS-rapporter)

- **progress/FAS7_CHAT_WINDOW_V2_REPORT.md**
- **progress/FAS8_MATCHING_V2_REPORT.md**
- **progress/FAS9_PROFILE_V2_REPORT.md**

### Övrigt

- **MAAK_UNIVERSAL_AGENT_GUIDE.md** – Agent-guide (startup questions, faser, rapportering).
- **DEMO.md**, **DEPLOY_DEMO.md** – Demo-läge och deploy av demo.
- **REVENUECAT_IOS_INTEGRATION.md** – RevenueCat iOS.
- **setup/SETUP_INSTRUCTIONS.md** – Instruktioner för ny utvecklare.
- **design-assets/** – Referensfiler (MaakUnifiedDesignSystem.jsx, PNG:er, MaakMascotShowcase.html).
