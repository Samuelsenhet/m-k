---
name: MÄÄK Development Workflows
description: Standard development, testing, and deployment procedures
---

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/Samuelsenhet/m-k.git
cd m-k

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add Supabase credentials to .env
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Local Development
```bash
# Start dev server (localhost:8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Variables
```env
# Get these values from Supabase Dashboard → Project Settings → API
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

## Database

### Supabase CLI
```bash
# Login to Supabase
supabase login

# Link to project (find your project ref in Supabase Dashboard → Project Settings → API)
supabase link --project-ref your-project-ref

# Create migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset

# Push to production
supabase db push
```

### Migrations
Located in `supabase/migrations/`

```bash
# Generate types from database
supabase gen types typescript --local > src/types/database.ts

# Test migration locally
supabase db reset
npm run dev
```

## Git Workflow

### Branching
```bash
# Feature branch
git checkout -b feature/feature-name

# Bug fix
git checkout -b fix/bug-description

# Hotfix
git checkout -b hotfix/issue-description
```

### Commits
```bash
# Conventional commits format
git commit -m "feat: add new personality test question"
git commit -m "fix: resolve navigation loop in onboarding"
git commit -m "docs: update README with setup instructions"
git commit -m "style: format code with prettier"
git commit -m "refactor: simplify match algorithm"
git commit -m "test: add unit tests for matching logic"
```

### Push
```bash
# Push and create PR
git push origin feature/feature-name

# Force push (use with caution)
git push --force-with-lease origin branch-name
```

## Deployment

### Vercel (Production)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment on Vercel
Add these in Vercel dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

### Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 20.x

## Testing

### Manual Testing Checklist
// ...existing code...
- [ ] Age verification (minimum 20 years)
- [ ] Personality test (30 questions)
- [ ] Results display with archetype
- [ ] Match generation
- [ ] Profile editing
- [ ] Dark mode toggle
- [ ] Mobile responsiveness
- [ ] PWA installation
- [ ] Push notifications

// ...existing code...

## Code Quality

### ESLint
```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### TypeScript
```bash
# Type check
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Pre-commit Checks
```bash
# Before committing
npm run lint
npm run build
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Supabase Connection Issues
1. Check `.env` file has correct credentials
2. Verify project is not paused on Supabase dashboard
3. Check RLS policies are enabled
4. Verify API key is not expired

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Performance Monitoring

### Lighthouse Scores (Target)
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### Bundle Analysis
```bash
# Build and analyze
npm run build
npx vite-bundle-visualizer
```

## Security

### Authentication Flow
1. User enters phone number
2. OTP sent (demo mode: 123456)
3. Age verification (20+ years)
4. Account created with email format: `{phone}@maak.app`
5. Profile completion in onboarding

### Data Protection
- All sensitive data behind RLS policies
- Phone numbers hashed before storage
- No passwords stored for demo accounts
- HTTPS only in production
