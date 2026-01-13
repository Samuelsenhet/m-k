# Twilio Send OTP Edge Function

This Supabase Edge Function sends an OTP code to a phone number using Twilio Verify.

## Environment Variables
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

## Usage
POST request with `{ phone: "+46701234567" }` in the body.
Requires Authorization header (Supabase JWT).
