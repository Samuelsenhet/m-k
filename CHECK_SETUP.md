# 🔧 Setup Check Guide

## 🚨 Current Error
"Kunde inte ansluta till servern. Kontrollera att Supabase URL är korrekt och att edge-funktionen är aktiverad."

**This means:** Your `.env` file has placeholder values that need to be replaced with real Supabase credentials.

---

## 🔴 Common console errors (blank app / red errors)

### 1. Supabase configuration error
**Message:** `Missing or invalid VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY`

**Fix:**
1. Copy `.env.example` to `.env` if you don’t have `.env` yet: `cp .env.example .env`
2. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**
3. Put **Project URL** into `VITE_SUPABASE_URL` and **anon public** key into `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
4. Restart the dev server: stop it (Ctrl+C), then run `npm run dev` again

### 2. "React is not defined" (e.g. at AchievementsPanel.tsx:30)

**Fix:**
1. Stop the dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Hard-refresh the browser: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)

If it still appears, run `npm run build` once, then `npm run dev` again.

## ⚡ Quick Fix (2 minutes)

1. **Get credentials:** https://supabase.com/dashboard → Settings → API
2. **Update `.env`:** Replace `your_project_id` and `your_anon_public_key` with real values
3. **Restart server:** Stop (Ctrl+C) and run `npm run dev` again
4. **Test:** Open browser console (F12) and run `window.testSupabase()`

---

## ⚠️ IMPORTANT: Replace Placeholder Values

Your `.env` file currently has **placeholder values** that need to be replaced with real credentials!

### 1. Get Your Supabase Credentials

**Step-by-step:**
1. Go to https://supabase.com/dashboard
2. **Sign in** or **create a new project** if you don't have one
3. Select your project (or create one)
4. Go to **Settings** (gear icon) → **API**
5. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

### 2. Update Your .env File

⚠️ **SECURITY NOTE:**
- **Never commit `.env` to version control** - it contains sensitive credentials
- Ensure `.env` is listed in your `.gitignore` file (it should be by default)
- Only commit `.env.example` with placeholder values as a template for other developers

Open `.env` in the project root and replace the placeholder values:

**Before (WRONG - placeholder values):**
```env
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_public_key"
```

**After (CORRECT - real values):**
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Quotes are optional for simple values without spaces or special characters (as shown above)
- Use quotes if your value contains spaces: `MY_VAR="value with spaces"`
- No spaces around the `=` sign
- Copy the exact values from Supabase dashboard

### 3. Test Your Configuration

After updating `.env`, you can test the connection:

**Option A: Browser Console (Recommended)**
1. Restart dev server: `npm run dev`
2. Open http://localhost:8080
3. Open browser console (F12)
4. Type: `window.testSupabase()`
5. Check the results

**About `window.testSupabase()`:**
This is a development helper function loaded from `src/lib/supabase-test.ts` that validates your Supabase connection. Expected outputs:
- ✅ Success: `"Supabase connection successful"` or similar confirmation
- ❌ Failure: Descriptive error message explaining what went wrong (e.g., invalid URL, missing key)

If the function is undefined, ensure the dev server is running and the test utility is being loaded (check that `src/lib/supabase-test.ts` exists and exports the helper to `window`).

**Option B: Manual Check**
1. Restart dev server: `npm run dev`
2. Try to send an OTP code
3. Check console for detailed error messages

### 4. Restart Dev Server

After updating `.env`, **always restart** your dev server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 5. Deploy Edge Functions

The Twilio edge functions need to be deployed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from Supabase Dashboard → Settings → API)
supabase link --project-ref your-project-ref

# Deploy the edge functions
supabase functions deploy twilio-send-otp
supabase functions deploy twilio-verify-otp
```

### 6. Set Edge Function Environment Variables

In Supabase Dashboard:
1. Go to **Edge Functions** → **twilio-send-otp** → **Settings**
2. Add these secrets:
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
   - `TWILIO_VERIFY_SERVICE_SID` - Your Twilio Verify Service SID (starts with "VA")

3. Repeat for **twilio-verify-otp** function

### 7. Test Connection

Open browser console and check for:
- ✅ No warnings about missing environment variables
- ✅ Network tab shows successful requests to Supabase

## Common Issues

### Issue: "Failed to fetch" or Network Error
**Solution:** 
- Check that `VITE_SUPABASE_URL` starts with `https://`
- Verify your Supabase project is not paused
- Check browser console for CORS errors

### Issue: "Edge function not found"
**Solution:**
- Deploy the edge functions (step 5 above)
- Verify function names match exactly: `twilio-send-otp` and `twilio-verify-otp`

### Issue: "Invalid API key"
**Solution:**
- Use the **anon public** key, not the service_role key
- Make sure there are no extra spaces in `.env` file

## Still Having Issues?

1. Check browser console for detailed error messages
2. Verify Supabase project is active (not paused)
3. Test edge function directly:
   ```bash
   # Replace placeholders before running:
   # - your-project → your Supabase project ref (from Dashboard → Settings → API)
   # - YOUR_ANON_KEY → your anon public key
   # - +46701234567 → the recipient's phone number in E.164 format
   curl -X POST \
     'https://your-project.supabase.co/functions/v1/twilio-send-otp' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"phone": "+46701234567"}'
   ```
