# 🚀 Quick Setup Instructions

## Current Issue
Your `.env` file contains placeholder values that need to be replaced with real Supabase credentials.

## Step 1: Get Supabase Credentials (2 minutes)

### Option A: Use Existing Project
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (or create a new one)
4. Click **Settings** (⚙️ gear icon) → **API**
5. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

### Option B: Create New Project
1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name**: MÄÄK (or any name)
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
4. Wait 2-3 minutes for project to be created
5. Go to **Settings** → **API** to get credentials

## Step 2: Update .env File

1. Open `.env` file in the project root
2. Replace the placeholder values:

**Find these lines:**
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_public_key"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
```

**Replace with your real values:**
```env
VITE_SUPABASE_PROJECT_ID="xxxxxxxxxxxxx"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY..."
VITE_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
```

**Important:**
- Remove quotes if they cause issues
- No spaces around `=`
- Copy the EXACT values from Supabase dashboard
- The URL should end with `.supabase.co`

## Step 3: Restart Dev Server

```bash
# Stop the current server (press Ctrl+C in terminal)
# Then restart:
npm run dev
```

## Step 4: Test Connection

1. Open http://localhost:8080 in your browser
2. Open Developer Console (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Type: `window.testSupabase()`
5. Press Enter
6. Check the results - you should see ✅ marks

## Step 5: Deploy Edge Functions (Required for Phone Auth)

The phone authentication requires edge functions to be deployed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
# Get your project reference from: Dashboard → Settings → API → Project URL
# It's the part between https:// and .supabase.co
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the edge functions
supabase functions deploy twilio-send-otp
supabase functions deploy twilio-verify-otp
```

## Step 6: Configure Edge Function Secrets

After deploying, you need to set Twilio credentials:

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on **twilio-send-otp** → **Settings** → **Secrets**
3. Add these secrets:
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token  
   - `TWILIO_VERIFY_SERVICE_SID` - Your Twilio Verify Service SID (starts with "VA")
4. Repeat for **twilio-verify-otp** function

## ✅ Verification Checklist

- [ ] `.env` file has real Supabase URL (not "your_project_id")
- [ ] `.env` file has real anon key (not "your_anon_public_key")
- [ ] Dev server restarted after updating `.env`
- [ ] `window.testSupabase()` shows ✅ for connection
- [ ] Edge functions deployed successfully
- [ ] Twilio secrets configured in edge functions

## 🆘 Still Having Issues?

1. **Check browser console** (F12) for detailed error messages
2. **Verify .env file** - make sure values are correct (no typos)
3. **Check Supabase project** - make sure it's not paused
4. **Test edge functions** - run `window.testSupabase()` in console

## 📝 Example .env File

Here's what a correct `.env` file should look like:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="abcdefghijklmnop"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODkwMTIzNCwiZXhwIjoxOTk0NDc3MjM0fQ.example"
VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
```

**Note:** These are example values - use YOUR actual values from Supabase dashboard!
