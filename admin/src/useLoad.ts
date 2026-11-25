import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import { useAuth } from "./auth";

/**
 * Loads data for a page and reloads when `key` changes. A 404 or 401 from an
 * admin endpoint means the session ended or the role was removed: back to sign-in.
 */
export function useLoad<T>(load: () => Promise<T>, key: string) {
  const { expire } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    load()
      .then((result) => {
        if (!live) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (!live) return;
        if (caught instanceof ApiError && (caught.status === 404 || caught.status === 401)) expire();
        setError(caught);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // `load` is rebuilt each render; `key` says when the inputs changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version, expire]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload };
}
