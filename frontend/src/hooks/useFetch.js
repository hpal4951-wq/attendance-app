import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Loads data from an async fetch function with:
 *  - initial loading state
 *  - pull-to-refresh (refreshing) state
 *  - error state
 *  - reload()
 *
 * `fetchFn` must be stable or its dependencies passed via `deps`
 * (e.g. useFetch(() => getBlocks(hostelId), [hostelId])).
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const run = useCallback(
    async (mode = "initial") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await fetchFn();
        if (mountedRef.current) setData(res);
        return res;
      } catch (e) {
        if (mountedRef.current) setError(e);
        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    mountedRef.current = true;
    run("initial");
    return () => {
      mountedRef.current = false;
    };
  }, [run]);

  const reload = useCallback(() => run("initial"), [run]);
  const refresh = useCallback(() => run("refresh"), [run]);

  return { data, loading, refreshing, error, reload, refresh, setData };
}

/**
 * Re-runs `reload` every time the screen regains focus, skipping the
 * very first focus (initial load already happened). Used to refresh
 * list screens after creating/editing a record.
 */
export function useFocusReload(reload) {
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reload();
    }, [reload])
  );
}
