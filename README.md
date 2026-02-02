# MÄÄK - Personality Test Dating App

Swedish personality-based dating platform with PRP compliance and user journey phases.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Auth**: Phone-based authentication
- **PWA**: Service worker enabled

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your Supabase credentials from https://supabase.com/dashboard
4. Install dependencies: `npm install`
5. **Supabase one-time setup** (fixes 400 on profiles, 404 on personality_results, "Bucket not found" on photo upload):
   - Option A: Run migrations: `npx supabase db push`
   - Option B: In [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the script `supabase/ONE_TIME_SETUP.sql`
   - If you see **"Could not find the 'alcohol' column"** or **"Kunde inte spara profilen"** after onboarding, run `supabase/ADD_PROFILE_COLUMNS.sql` in the SQL Editor once.
6. Run dev server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Live preview (VS Code / Cursor)

This is a **Vite + React** app, so the **Live Server** extension will not work (it serves static files; this app needs Vite to compile TypeScript/JSX). Use the **Vite dev server** instead:

- **Command Palette**: `F1` or `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) → type **Tasks: Run Task** → choose **Start dev server (Vite)**.
- **Keyboard**: Run the default build task (often `Ctrl+Shift+B` / `Cmd+Shift+B`).
- **Terminal**: `npm run dev`, then open http://localhost:8080

## Deployment

Built for deployment on Vercel with Supabase backend.

## Project Structure

```
src/
├── components/     # React components (17+ folders)
├── contexts/       # React contexts (Auth, Consent)
├── hooks/          # Custom hooks (12 hooks)
├── pages/          # Route pages (9 pages)
├── integrations/   # Supabase integration
└── lib/           # Utilities
```

## Features

- 🔐 Phone-based authentication
- 🎭 Personality test & matching algorithm
- 💬 Real-time chat
- 🎉 Achievement system
- 🤖 AI assistant
- 📱 PWA support
- 🌍 i18n (Swedish)
- 🛡️ GDPR compliant

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the Lovable Project and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
