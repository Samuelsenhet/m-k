import { useEffect, useState } from "react";

/**
 * Web helper: only return `value` after the component has mounted on the client.
 * This avoids hydration / environment mismatches in `expo-router` web.
 */
export function useClientOnlyValue<T>(value: T, fallback: T): T {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? value : fallback;
}

