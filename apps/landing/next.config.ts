import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Static export, served at maakapp.se root (Loopia webbhotell).
 * - output: "export" writes fully-static HTML/CSS/JS to `out/` (no Node server needed)
 * - trailingSlash: Apache mod_dir serverar /privacy/ → /privacy/index.html
 * - images.unoptimized: next/image's server-side optimizer är otillgänglig i static export
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
