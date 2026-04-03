import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./config/vitest.setup.ts'],
    // Jest + expo-router/testing-library lives under apps/mobile; keep Vitest on the Vite app only.
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/mobile/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@maak/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
    },
  },
});
