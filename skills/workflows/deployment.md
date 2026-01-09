## Deployment Guide

### Overview
Complete guide for deploying MÄÄK to production on Vercel with Supabase backend.

## Prerequisites

### Accounts Required
- **GitHub** - Code repository
- **Vercel** - Frontend hosting
- **Supabase** - Backend and database

### Tools
```bash
# Install Vercel CLI
npm i -g vercel

# Install Supabase CLI
brew install supabase/tap/supabase

# Verify installations
vercel --version
supabase --version
```

## Environment Setup

### Production Environment Variables

Create these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Supabase Configuration (get from Supabase Dashboard → Project Settings → API)
VITE_SUPABASE_PROJECT_ID=<SUPABASE_PROJECT_ID>
VITE_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>
VITE_SUPABASE_URL=<SUPABASE_URL>
```

**Note:** Replace all `<PLACEHOLDER>` values with your actual credentials from Supabase Dashboard.

### Environment per Branch
- **Production**: Main branch
- **Preview**: All other branches (automatic)
- **Development**: Local only

## Vercel Deployment

### Initial Setup

```bash
# Login to Vercel
vercel login

# Link project (run in project root)
cd <project-root>
vercel link

# Set environment variables
vercel env add VITE_SUPABASE_PROJECT_ID production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
vercel env add VITE_SUPABASE_URL production
```

### Build Configuration

Vercel detects Vite automatically. Verify these settings:

**Framework**: Vite
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`
**Node Version**: 20.x

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

### Preview Deployments

Every push to non-main branches creates a preview:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# Preview URL: https://m-k-preview-xxx.vercel.app
```

## Supabase Production Setup

### Database Migration

```bash
# Login to Supabase
supabase login

# Link to production project (find project ref in Supabase Dashboard → Project Settings → API)
supabase link --project-ref <your-project-ref>

# Push local migrations to production
supabase db push

# Verify migrations applied
supabase db remote ls
```

### Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-assistant
supabase functions deploy generate-icebreakers
supabase functions deploy send-notification

# Test function
# Get YOUR_ANON_KEY from Supabase Dashboard → Project Settings → API → anon public key
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/ai-assistant' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"message": "test"}'
```

### Storage Buckets

Setup profile photo storage:
```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

-- Set bucket policy
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Custom Domain Setup

### Add Domain to Vercel

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain: `maak.app` and `www.maak.app`
3. Configure DNS records:

```dns
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

4. Wait for DNS propagation (up to 48 hours)

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

## Performance Optimization

### Build Optimization

Already configured in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': ['framer-motion', '@radix-ui/react-*'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-form': ['react-hook-form', 'zod'],
        'vendor-utils': ['date-fns', 'lucide-react'],
      },
    },
  },
  chunkSizeWarningLimit: 600,
},
```

### Image Optimization

Use Supabase image transforms for optimized images:
```tsx
// Optimize images with Supabase transforms
const optimizedUrl = supabase.storage
  .from('profile-photos')
  .getPublicUrl(path, {
    transform: {
      width: 400,
      height: 400,
      quality: 80,
    },
  });
```

### Caching Headers

Configure in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## PWA Configuration

### Service Worker

Already configured in `vite.config.ts` with `vite-plugin-pwa`:
```typescript
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "MÄÄK - Personlighetstest för Relationer",
    short_name: "MÄÄK",
    theme_color: "#f97316",
    background_color: "#fdf8f6",
    display: "standalone",
  },
})
```

### App Store Submission (Future)

For iOS/Android apps using Capacitor:
```bash
# Build for iOS
npx cap add ios
npx cap sync ios
npx cap open ios

# Build for Android
npx cap add android
npx cap sync android
npx cap open android
```

## Monitoring & Analytics

### Vercel Analytics

Enable in Dashboard → Project → Analytics

### Error Tracking

Add Sentry (optional):
```bash
npm install @sentry/react @sentry/vite-plugin

# In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

### Performance Monitoring

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Database Backup

### Automatic Backups

Supabase Pro/Team plans include:
- Daily automated backups
- Point-in-time recovery
- 7-day retention (Pro), 30-day (Team)

### Manual Backup

```bash
# Recommended: Export using Supabase CLI
supabase db dump -f backup.sql

# Alternative: Direct pg_dump (requires database password)
# Get YOUR-DB-PASSWORD from Supabase Dashboard → Project Settings → Database → Connection info
# Replace <your-project-ref> with your actual project reference
pg_dump "postgresql://postgres:[YOUR-DB-PASSWORD]@db.<your-project-ref>.supabase.co:5432/postgres" > backup.sql
```

**Security Note:** Keep database credentials secure. Never commit passwords to version control.

## Rollback Procedures

### Vercel Rollback

1. Go to Deployments tab
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"

### Database Rollback

```bash
# Revert last migration
supabase migration repair --status reverted [migration-name]

# Apply older migration
supabase db reset --db-url [your-db-url]
```

## Health Checks

### Automated Monitoring

Create health check endpoint in Edge Function:
```typescript
// supabase/functions/health/index.ts
Deno.serve(() => {
  return new Response(
    JSON.stringify({ status: 'healthy', timestamp: new Date() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Status Page

Setup uptime monitoring with UptimeRobot or Better Uptime:

1. Create free account at uptimerobot.com or betteruptime.com
2. Add new HTTP(S) monitor:
   - **Frontend**: `https://maak.app`
   - **API Health**: `https://<your-project-ref>.supabase.co/functions/v1/health`
3. Configure check interval (recommended: 5 minutes)
4. Setup alert channels (email, Slack, webhook)
5. Add `Authorization: Bearer <ANON_KEY>` header if health endpoint requires authentication

## Security Checklist

- [ ] Environment variables set in Vercel
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket policies configured
- [ ] HTTPS enforced
- [ ] CORS configured for production domain
- [ ] API keys rotated from development
- [ ] Rate limiting enabled (Supabase dashboard)
- [ ] Audit logs enabled

## Post-Deployment Testing

```bash
# Test production build locally
npm run build
npm run preview

# Test production API
curl https://maak.app/api/health

# Test Supabase connection
curl https://zcikfntelmtkgoibtttc.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

## Troubleshooting

### Build Fails

```bash
# Clear cache
vercel build --force

# Check logs
vercel logs [deployment-url]
```

### Environment Variables Not Loading

1. Verify variables set in Vercel dashboard
2. Redeploy: `vercel --prod`
3. Check variable names include `VITE_` prefix

### Database Connection Issues

1. Check Supabase project not paused
2. Verify connection pooler settings
3. Check RLS policies allow access

## Maintenance Windows

Schedule database maintenance:
1. Announce in app banner
2. Set maintenance mode
3. Perform updates
4. Test thoroughly
5. Resume normal operation

```typescript
// Maintenance mode component
export function MaintenanceBanner() {
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE === 'true';
  
  if (!isMaintenanceMode) return null;
  
  return (
    <div className="bg-yellow-500 text-black p-4 text-center">
      Underhållsarbete pågår. Vissa funktioner kan vara tillfälligt otillgängliga.
    </div>
  );
}
```
