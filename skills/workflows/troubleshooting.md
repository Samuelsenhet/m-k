## Troubleshooting Guide

### Overview
Common issues, error messages, and their solutions for MÄÄK development and deployment.

## Development Issues

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution:**
```bash
# Find process using port 8080
lsof -ti:8080

# Kill the process
lsof -ti:8080 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Module Not Found

**Error:**
```
Error: Cannot find module '@/components/...'
```

**Solutions:**
```bash
# 1. Check tsconfig paths
cat tsconfig.json | grep paths

# 2. Restart dev server
# Stop server (Ctrl+C)
npm run dev

# 3. Clear cache and reinstall
rm -rf node_modules
npm install

# 4. Check file actually exists
ls src/components/...
```

### TypeScript Errors

**Error:**
```
Type 'X' is not assignable to type 'Y'
```

**Solutions:**
```typescript
// 1. Check type definitions
// Hover over variable in VS Code to see inferred type

// 2. Add explicit type assertion
const data = response as ExpectedType;

// 3. Use type guards
if (typeof data === 'string') {
  // data is string here
}

// 4. Generate fresh types from database
npx supabase gen types typescript --local
```

### Build Fails

**Error:**
```
Build failed with errors
```

**Solutions:**
```bash
# 1. Clear dist folder
rm -rf dist

# 2. Check for console.logs in production
# Remove or wrap in dev checks
if (import.meta.env.DEV) {
  console.log('debug info');
}

# 3. Check for missing environment variables
cat .env

# 4. Try clean install
rm -rf node_modules dist
npm install
npm run build
```

## Authentication Issues

### Navigation Loop After Age Verification

**Symptoms:**
- After completing age verification, redirects back to phone auth
- Infinite loop between /onboarding and /phone-auth

**Solution:**
Already fixed in codebase. If reoccurs:
```typescript
// In PhoneAuth.tsx useEffect
if (user && !isCompletingProfile && step !== 'profile') {
  // Only check status if not on profile step
}

// In Onboarding.tsx checkOnboardingStatus
if (!profile.date_of_birth) {
  // Wait and retry once for race condition
  await new Promise(resolve => setTimeout(resolve, 500));
  // Re-query before redirecting
}
```

### Email Validation Fails

**Error:**
```
// ...existing code...
```

**Solution:**
```typescript
// Correct email format
const cleanPhone = phone.replace(/\D/g, '');
// ...existing code...
```

### Session Expired

**Symptoms:**
- User logged out unexpectedly
- "Session has expired" message

**Solutions:**
```typescript
// 1. Check session validity
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Refresh token
  await supabase.auth.refreshSession();
}

// 2. Extend session duration (in Supabase dashboard)
// Auth > Settings > JWT expiry

// 3. Implement auto-refresh
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    }
  );
  return () => subscription.unsubscribe();
}, []);
```

### Duplicate Phone Number

**Error:**
```
duplicate key value violates unique constraint "profiles_phone_key"
```

**Solution:**
Already handled in usePhoneAuth hook:
```typescript
// Check if phone exists before signup
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('phone', formattedPhone)
  .maybeSingle();

if (existingProfile) {
  setError('Detta telefonnummer är redan registrerat');
  return false;
}
```

## Database Issues

### RLS Policy Blocks Access

**Error:**
```
new row violates row-level security policy
```

**Solutions:**
```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Verify user has auth.uid()
SELECT auth.uid();

-- 3. Check policy definition
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Temporarily disable for testing (NOT in production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. Re-enable with correct policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Migration Fails

**Error:**
```
migration already exists
```

**Solutions:**
```bash
# 1. Check migration status
supabase migration list

# 2. Repair migration status
supabase migration repair --status reverted [migration-name]

# 3. Reset local database
supabase db reset

# 4. If production, create new migration
supabase migration new fix_previous_migration
```

### Realtime Not Working

**Symptoms:**
- New messages don't appear automatically
- Subscription doesn't trigger

**Solutions:**
```typescript
// 1. Check realtime enabled for table
// Supabase Dashboard > Database > Replication
// Enable for messages table

// 2. Verify channel subscription
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// 3. Check cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Connection Pool Exhausted

**Error:**
```
remaining connection slots are reserved
```

**Solutions:**
```typescript
// 1. Always clean up subscriptions
useEffect(() => {
  const channel = supabase.channel('...');
  // ... setup
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// 2. Use connection pooler
// Supabase Dashboard > Database > Connection pooling
// Use pooler connection string

// 3. Increase pool size (Pro plan)
// Database > Settings > Connection pooler > Pool size
```

## Performance Issues

### Slow Page Load

**Symptoms:**
- Initial page load takes > 3 seconds
- Lighthouse performance score < 90

**Solutions:**
```bash
# 1. Analyze bundle
npm run build
npx vite-bundle-visualizer

# 2. Check for large dependencies
npm ls --depth=0

# 3. Lazy load routes
const Matches = lazy(() => import('./pages/Matches'));

# 4. Optimize images
# Use WebP format, compress before upload
```

### Memory Leak

**Symptoms:**
- Browser becomes slow over time
- High memory usage in DevTools

**Solutions:**
```typescript
// 1. Check for uncleared intervals
useEffect(() => {
  const interval = setInterval(() => {
    // ...
  }, 1000);
  
  return () => clearInterval(interval); // IMPORTANT
}, []);

// 2. Check for unremoved event listeners
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler); // IMPORTANT
  };
}, []);

// 3. Check for unclosed Supabase channels
// See realtime cleanup above
```

### Infinite Render Loop

**Symptoms:**
- Component re-renders constantly
- Browser freezes

**Solutions:**
```typescript
// 1. Check useEffect dependencies
useEffect(() => {
  // If this modifies state that's in deps, infinite loop!
}, [state]); // Be careful

// 2. Use useCallback for functions in deps
const handleClick = useCallback(() => {
  // ...
}, []);

useEffect(() => {
  handleClick();
}, [handleClick]); // Safe now

// 3. Use refs for non-reactive values
const countRef = useRef(0);
// No re-render when countRef.current changes
```

## Deployment Issues

### Build Succeeds Locally but Fails on Vercel

**Error:**
```
Error: Build failed
```

**Solutions:**
```bash
# 1. Check Node version matches
node --version
# Update vercel.json if needed
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist"
}

# 2. Check environment variables set
# Vercel Dashboard > Settings > Environment Variables

# 3. Check for case-sensitive imports
# Linux is case-sensitive, macOS isn't
import { Button } from '@/components/ui/button'; // Correct
import { Button } from '@/components/ui/Button'; // Wrong if file is button.tsx

# 4. Clear Vercel cache
vercel --force
```

### Environment Variables Not Loading

**Symptoms:**
- `import.meta.env.VITE_*` is undefined
- API calls fail

**Solutions:**
```bash
# 1. Verify variables in Vercel dashboard
# Must start with VITE_ to be exposed

# 2. Check variable names exactly match
VITE_SUPABASE_URL  # Correct
VITE_SUPABASE_Url  # Wrong - case sensitive

# 3. Redeploy after adding variables
vercel --prod

# 4. Check .env.example matches production
cat .env.example
```

### 404 on Page Refresh

**Symptoms:**
- Direct URLs return 404
- Refreshing page shows 404

**Solution:**
Create `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Supabase Issues

### Project Paused

**Error:**
```
FetchError: request to https://[project].supabase.co failed
```

**Solution:**
```bash
# 1. Check project status in dashboard
# Projects > [Your Project] > Resume project

# 2. Free tier projects pause after 1 week inactivity
# Keep active or upgrade to Pro

# 3. Set up monitoring
# Use UptimeRobot to ping API every 5 minutes
```

### Storage Upload Fails

**Error:**
```
Storage error: Policy prevents upload
```

**Solutions:**
```sql
-- 1. Check bucket policies
SELECT * FROM storage.objects WHERE bucket_id = 'profile-photos';

-- 2. Verify RLS policies on storage.objects
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Check bucket is public if needed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';
```

### Edge Function Timeout

**Error:**
```
Function exceeded time limit
```

**Solutions:**
```typescript
// 1. Optimize function logic
// Move heavy processing to background job

// 2. Increase timeout (Pro plan)
// Functions > Settings > Timeout

// 3. Split into multiple functions
// One triggers, another processes

// 4. Use database triggers instead
CREATE FUNCTION process_match() RETURNS TRIGGER AS $$
BEGIN
  -- Processing logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## UI/UX Issues

### Dark Mode Flashing

**Symptoms:**
- Brief flash of light mode on load
- Theme switches after page loads

**Solution:**
```typescript
// Add to <head> before React loads
<script>
  const theme = localStorage.getItem('theme');
  if (theme === 'dark' || 
      (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

### Animation Janky

**Symptoms:**
- Animations stutter
- FPS drops below 60

**Solutions:**
```typescript
// 1. Use transform instead of top/left
// Bad
<motion.div animate={{ left: 100 }} />

// Good
<motion.div animate={{ x: 100 }} />

// 2. Use will-change for complex animations
<motion.div style={{ willChange: 'transform' }} />

// 3. Reduce animation complexity
// Animate fewer properties at once

// 4. Use CSS animations for simple cases
className="animate-bounce"
```

### Layout Shift (CLS)

**Symptoms:**
- Content jumps around while loading
- Poor Lighthouse CLS score

**Solutions:**
```tsx
// 1. Reserve space for images
<img 
  src={url} 
  width={400} 
  height={400} 
  alt="..." 
/>

// 2. Use skeleton loaders
{loading ? <Skeleton className="h-20 w-full" /> : <Content />}

// 3. Set explicit dimensions
<div className="h-64 w-full">
  {/* content */}
</div>
```

## Getting Help

### Check Logs

```bash
# Vercel logs
vercel logs [deployment-url]

# Supabase logs
# Dashboard > Logs > API / Auth / Database

# Browser console
# F12 > Console tab

# Network requests
# F12 > Network tab
```

### Create Issue

Use GitHub Issues with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots
- Console errors
- Environment details

### Community Support

- Supabase Discord
- React Community
- Stack Overflow
- Vercel Support
