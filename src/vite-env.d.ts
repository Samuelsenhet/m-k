/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ENABLE_DEMO?: string;
  readonly VITE_APP_URL?: string;
  /** Public HTTPS URL when dev server is behind a tunnel/reverse proxy (see DOMAIN_SETUP.md §8) */
  readonly VITE_DEV_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
