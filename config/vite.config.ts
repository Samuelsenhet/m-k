import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_DEV_PORT = 8080;

function parseDevServerPort(env: Record<string, string>): number {
  const raw = env.VITE_DEV_SERVER_PORT?.trim();
  if (!raw) return DEFAULT_DEV_PORT;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : DEFAULT_DEV_PORT;
}

/** Strip BOM, quotes, and trailing slash so `new URL()` matches copy-paste from .env files. */
function normalizeDevOrigin(raw: string | undefined): string {
  if (!raw) return "";
  let s = raw.replace(/\r/g, "").trim().replace(/^\uFEFF/, "");
  s = s.replace(/^["']+|["']+$/g, "").trim();
  return s.replace(/\/$/, "");
}

function devCspMetaForPort(port: number): string {
  const h = `http://127.0.0.1:${port} http://localhost:${port} ws://127.0.0.1:${port} ws://localhost:${port}`;
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maakapp.se wss://maakapp.se https://*.maakapp.se wss://*.maakapp.se ${h}; frame-src 'none'; object-src 'none'; base-uri 'self';" />`;
}

function readBoundPort(server: ViteDevServer | undefined, fallback: number): number {
  const addr = server?.httpServer?.address();
  if (
    addr &&
    typeof addr === "object" &&
    "port" in addr &&
    typeof (addr as { port: unknown }).port === "number"
  ) {
    return (addr as { port: number }).port;
  }
  return fallback;
}

/**
 * Dev server only: replace index.html CSP so HMR WebSockets are allowed.
 * Reads the actual bound port from the HTTP server when transforming HTML (avoids a race
 * where transformIndexHtml ran before the "listening" event updated a cached port).
 */
function devCspForHmrPlugin(mode: string): Plugin {
  const env = loadEnv(mode, projectRoot, "");
  const fallbackPort = parseDevServerPort(env);
  let devServer: ViteDevServer | undefined;
  return {
    name: "maak-dev-csp-hmr",
    apply: "serve",
    configureServer(server) {
      devServer = server;
    },
    transformIndexHtml: {
      order: "pre",
      handler(html: string) {
        const port = readBoundPort(devServer, fallbackPort);
        return html.replace(
          /<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/,
          devCspMetaForPort(port),
        );
      },
    },
  };
}

/** Hosts allowed to hit the dev server (HTTP + WebSocket). Tunnel Host header must match. */
function allowedHostsForPublicDev(hostname: string): string[] {
  const list = [hostname, "localhost", "127.0.0.1", "::1"];
  const segments = hostname.split(".");
  if (segments.length >= 2) {
    list.push(`.${segments.slice(-2).join(".")}`);
  }
  return list;
}

/**
 * When you terminate TLS in front of Vite (Cloudflare Tunnel, Caddy, nginx → localhost:8080),
 * set VITE_DEV_ORIGIN=https://maakapp.se (or https://dev.maakapp.se) in .env so asset URLs
 * and HMR use the public host. See docs/DOMAIN_SETUP.md §8.
 *
 * If HMR still fails ("WebSocket closed without opened"), your proxy must forward WebSocket
 * upgrades to this port, or set VITE_DISABLE_HMR=true (no hot reload; use full refresh).
 */
function devServerWithPublicUrl(mode: string) {
  const env = loadEnv(mode, projectRoot, "");
  const devPort = parseDevServerPort(env);
  const disableHmr =
    env.VITE_DISABLE_HMR === "true" || env.VITE_DISABLE_HMR === "1";

  const raw = normalizeDevOrigin(env.VITE_DEV_ORIGIN);
  if (mode !== "development" || !raw) {
    return {
      host: "::" as const,
      port: devPort,
      /** If 8080 is taken (e.g. another `npm run dev`), use the next free port. Tunnel mode keeps strictPort below. */
      strictPort: false,
      hmr: disableHmr ? false : { overlay: false },
    };
  }
  try {
    const u = new URL(raw);
    const https = u.protocol === "https:";
    const clientPort = u.port ? Number.parseInt(u.port, 10) : https ? 443 : 80;
    return {
      host: "::" as const,
      port: devPort,
      strictPort: true,
      origin: raw,
      allowedHosts: allowedHostsForPublicDev(u.hostname),
      hmr: disableHmr
        ? false
        : {
            overlay: false,
            protocol: https ? ("wss" as const) : ("ws" as const),
            host: u.hostname,
            /** WebSocket server listens on the same port as the dev server (proxy forwards wss → here). */
            port: devPort,
            clientPort,
          },
    };
  } catch {
    console.warn("[vite] VITE_DEV_ORIGIN is invalid, ignoring:", raw);
    return {
      host: "::" as const,
      port: devPort,
      strictPort: false,
      hmr: disableHmr ? false : { overlay: false },
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
    mode === "development" && devCspForHmrPlugin(mode),
    react(),
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
