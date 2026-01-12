/**
 * Development-only logger utility
 * Wraps console methods to only output in development mode
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
  group: (label: string) => {
    if (import.meta.env.DEV) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  },
};
