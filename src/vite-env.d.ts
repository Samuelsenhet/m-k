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
  /** Set to "true" to disable Vite HMR WebSocket (no hot reload; use if proxy blocks WS). */
  readonly VITE_DISABLE_HMR?: string;
  /** Vite dev server port (default 8080). Match your tunnel target when using VITE_DEV_ORIGIN. */
  readonly VITE_DEV_SERVER_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
