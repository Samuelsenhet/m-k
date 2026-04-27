# track-email Edge Function

Anropas när en mottagare öppnar ett e-postmeddelande (eller klickar på en tracking-länk). Uppdaterar `email_logs.opened_at` eller `email_logs.clicked_at`.

## Anrop

- **GET** `?log_id=<uuid>` – sätter `opened_at` (standard).
- **GET** `?log_id=<uuid>&type=click` – sätter `clicked_at`.

Returnerar en 1×1 transparent GIF (tracking-pixel).

## Användning

`send-email` injicerar automatiskt en pixel i varje utskick:

```html
<img src="${SUPABASE_URL}/functions/v1/track-email?log_id=${logId}" width="1" height="1" style="display:none;" alt="" />
```

Inga secrets krävs; funktionen använder `SUPABASE_SERVICE_ROLE_KEY` för att uppdatera `email_logs`.
