# Twilio Verify OTP Edge Function

This Supabase Edge Function verifies an OTP code for a phone number using Twilio Verify.

## Environment Variables
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

## Usage
POST request with `{ phone: "+46701234567", code: "123456" }` in the body.
Requires Authorization header (Supabase JWT).
