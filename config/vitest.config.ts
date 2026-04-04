import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  // So Vitest works when invoked from apps/mobile or any cwd (paths resolve to monorepo root).
  root: monorepoRoot,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.join(__dirname, 'vitest.setup.ts')],
    // Jest + expo-router/testing-library lives under apps/mobile; keep Vitest on the Vite app only.
    // m-k-backup is a duplicate tree — exclude so tests are not run twice and `npm test <word>` does not pick backup paths.
    exclude: [...configDefaults.exclude, 'apps/mobile/**', 'm-k-backup/**'],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@': path.join(monorepoRoot, 'src'),
      '@maak/core': path.join(monorepoRoot, 'packages/core/src/index.ts'),
    },
  },
});
