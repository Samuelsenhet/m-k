/**
 * Expo project root is apps/mobile — use CommonJS (.cjs) because the repo root has "type": "module".
 * Delegates to monorepo root app.config.cjs (paths, Supabase extra, VITE_* fallbacks).
 */
module.exports = require("../../app.config.cjs");
