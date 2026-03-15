# EAS Build – felsökning

Kända fel och lösningar för EAS Build (iOS och Android).

## iOS: Provisioning profile saknar Push Notifications

**Felmeddelande:**

```
Provisioning profile "*[expo] com.samuelsenhet.maak AdHoc ..." doesn't include the Push Notifications capability.
Provisioning profile "... doesn't include the aps-environment entitlement.
```

**Orsak:** Appen använder `expo-notifications` (som kräver `aps-environment`), men den Ad Hoc-profil EAS använder skapades utan Push Notifications-capability.

**Åtgärd i projektet (redan gjord):**

- I **app.json** finns `ios.entitlements` med `aps-environment: development`. När du kör `eas build` synkar EAS capabilities mot Apple Developer och ska då slå på Push Notifications för App ID och skapa en ny profil som inkluderar den.

**Vad du ska göra:**

1. Committa och pusha ändringarna (inkl. `app.json` med `ios.entitlements`).
2. Kör om bygget: `eas build --platform ios --profile development` (eller den profil du använder).
3. Om felet kvarstår: Kontrollera i [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list) att App ID **com.samuelsenhet.maak** har **Push Notifications** ikryssad. Om inte, kryssa i och spara, och kör sedan om EAS-bygget.
4. Vid behov: I EAS kan du ta bort den gamla provisioning-profilen så att en ny skapas: [expo.dev](https://expo.dev) → Project → Credentials → iOS → ta bort Ad Hoc-profilen och kör bygget igen.

---

## Android: Entity not authorized (AndroidKeystoreEntity CREATE)

**Felmeddelande:**

```
Entity not authorized: AndroidKeystoreEntity[00000000-0000-0000-0000-000000000000] (viewer = ScopedAccountActorViewerContext, action = CREATE, ruleIndex = -1)
```

**Orsak:** Ditt Expo-konto har inte behörighet att **skapa** en Android-keystore för projektet (t.ex. begränsad roll eller nytt projekt utan keystore).

**Åtgärd:**

1. Kontrollera att du är inloggad med ett konto som har **Owner** (eller motsvarande) för EAS-projektet.
2. Om du använder ett team: Ge ditt konto rättighet att hantera Android-credentials (skapa keystore).
3. Om projektet redan har en keystore men bygget försöker skapa en ny: Kontakta Expo support eller kolla [expo.dev/contact](https://expo.dev/contact) om du tror att det är ett fel.
4. Som tillfällig lösning: Bygg Android lokalt med `npx expo run:android` (kräver att du har Android-keystore lokalt konfigurerad).

---

## Expo Doctor: icon inte kvadratisk

**Fel:** `Field: icon - image should be square, but the file at './assets/icon.png' has dimensions 1024x990.`

**Åtgärd:** Kör skriptet som gör ikonen 1024×1024:

```sh
node scripts/make-icon-square.mjs
```

(Kräver `sharp` som devDependency; installeras med `npm install`.)

---

## Expo Doctor: paketversioner

**Fel:** `react`, `@types/react` eller `react-native-worklets` matchar inte den version Expo SDK förväntar sig.

**Åtgärd:** Granska och uppdatera beroenden:

```sh
npx expo install --check
```

Följ rekommendationerna (uppgradera eller lägg eventuellt till `expo.install.exclude` i **package.json** om du medvetet vill behålla en annan version).

---

## Länkar

- [Expo iOS capabilities](https://docs.expo.dev/build-reference/ios-capabilities/)
- [EAS Build – How it works](https://docs.expo.dev/build-reference/how-eas-build-works/)
