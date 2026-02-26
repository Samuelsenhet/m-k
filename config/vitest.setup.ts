/**
 * Vitest setup file – runs before each test file.
 * Mocks browser APIs that Supabase auth requires.
 */

// Suppress known Radix UI warning about Description components
// This is a timing issue in React where the Content component
// checks for Description before it has mounted. Does not affect functionality.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0];
  if (
    typeof msg === "string" &&
    msg.includes("Missing `Description` or `aria-describedby={undefined}`")
  ) {
    return; // suppress this specific warning
  }
  originalWarn.apply(console, args);
};

// Mock localStorage for Supabase auth
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock matchMedia (used by some UI components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
