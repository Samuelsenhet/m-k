import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const projectRoot = path.resolve(__dirname, "..");

/**
 * When you terminate TLS in front of Vite (Cloudflare Tunnel, Caddy, nginx → localhost:8080),
 * set VITE_DEV_ORIGIN=https://maakapp.se (or https://dev.maakapp.se) in .env so asset URLs
 * and HMR use the public host. See docs/DOMAIN_SETUP.md §8.
 */
function devServerWithPublicUrl(mode: string) {
  const env = loadEnv(mode, projectRoot, "");
  const raw = env.VITE_DEV_ORIGIN?.trim().replace(/\/$/, "");
  if (mode !== "development" || !raw) {
    return {
      host: "::" as const,
      port: 8080,
      hmr: { overlay: false },
    };
  }
  try {
    const u = new URL(raw);
    const https = u.protocol === "https:";
    const clientPort = u.port ? Number.parseInt(u.port, 10) : https ? 443 : 80;
    return {
      host: "::" as const,
      port: 8080,
      strictPort: true,
      origin: raw,
      allowedHosts: [u.hostname, "localhost", "127.0.0.1"],
      hmr: {
        overlay: false,
        protocol: https ? ("wss" as const) : ("ws" as const),
        host: u.hostname,
        clientPort,
      },
    };
  } catch {
    console.warn("[vite] VITE_DEV_ORIGIN is invalid, ignoring:", raw);
    return {
      host: "::" as const,
      port: 8080,
      hmr: { overlay: false },
    };
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
  },
  server: devServerWithPublicUrl(mode),
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "MÄÄK - Personlighetstest för Relationer",
        short_name: "MÄÄK",
        description:
          "Upptäck din personlighetstyp och hitta kompatibla partners",
        theme_color: "#f97316",
        background_color: "#fdf8f6",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB – mascot + landing images (e.g. landing-profile-elin.png ~7 MB)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    // Single React instance: without this, pre-bundled deps (e.g. Radix) can resolve a
    // different `react` than the app → "Invalid hook call" / `useRef` on null dispatcher.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "../src"),
      // Use workspace source so UI (e.g. PersonalityGuide) picks up emoji/copy changes without a stale `packages/core/dist`.
      "@maak/core": path.resolve(__dirname, "../packages/core/src/index.ts"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "lucide-react"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "form-vendor": ["zod", "sonner"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
