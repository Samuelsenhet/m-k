import { useCallback, useEffect, useState } from "react";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Generic async data fetching hook with loading/error states.
 *
 * @param fetcher - Async function returning data. Throw to signal errors.
 * @param deps - Dependency array for re-fetching (like useEffect deps).
 *
 * @example
 * const { data: profile, loading, error, refresh } = useFetch(
 *   () => supabase.from("profiles").select("*").eq("id", userId).single().then(r => r.data),
 *   [userId],
 * );
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      if (__DEV__) console.error("[useFetch]", e);
      setError(e instanceof Error ? e.message : "fetch failed");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
