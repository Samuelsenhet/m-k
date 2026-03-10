# EAS project ID and owner

## Vad styr länken till Expo dashboard?

- **URL:** `https://expo.dev/accounts/{owner}/projects/{slug}`
- **owner** sätts i `app.json` under `"owner": "samuelsenhet"`.
- **slug** kommer från `app.json` → `"slug": "maak"`.

Så länge projektet är kopplat till kontot **samuelsenhet** måste `owner` i `app.json` vara **samuelsenhet**.

## Varför krävs matchning?

EAS identifierar projektet via **projectId** i `app.json`:

```json
"extra": {
  "eas": {
    "projectId": "4d900a70-4327-4740-83cc-4ac6745ef8eb"
  }
}
```

Det projektet tillhör ett specifikt Expo-konto. Om du sätter `"owner": "annat-konto"` medan projectId fortfarande pekar på ett projekt under **samuelsenhet**, får du:

```text
Owner of project identified by "extra.eas.projectId" (samuelsenhet) does not match owner specified in the "owner" field (annat-konto).
```

## Så byter du dashboard till ett annat konto (t.ex. samuelensen)

1. **Alternativ A – flytta projektet i Expo**
   - Logga in på [expo.dev](https://expo.dev) med det konto som ska äga projektet (t.ex. **samuelensen**).
   - Gå till projektet (via samuelsenhet-kontot eller direktlänk).
   - Öppna **Project settings** → **Transfer project** (eller motsvarande) och flytta till **samuelensen**.
   - Efter flytten: sätt i `app.json`  
     `"owner": "samuelensen"`  
     (behåll samma `extra.eas.projectId`).

2. **Alternativ B – nytt projekt under det nya kontot**
   - Logga in som **samuelensen** och skapa ett nytt projekt för samma app (eller länka repot till ett nytt EAS-projekt).
   - Kopiera det nya projektets **Project ID** från Expo dashboard.
   - Uppdatera i `app.json`:
     - `"owner": "samuelensen"`
     - `"extra.eas.projectId": "<nytt-project-id>"`
     - `"updates.url"`: använd den URL Expo visar för det nya projektet (format `https://u.expo.dev/<project-id>`).

Tills du antingen flyttat projektet eller skapat ett nytt under **samuelensen** ska `owner` i `app.json` vara **samuelsenhet** så att det matchar projectId.
