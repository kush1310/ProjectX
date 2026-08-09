import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';

const globalDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

interface UseOnDemandDataOptions<T> {
  key: string;
  fetcher?: () => Promise<T>;
  url?: string;
  enabled?: boolean;
  ttl?: number;
  initialData?: T;
}

export function useOnDemandData<T = any>({
  key,
  fetcher,
  url,
  enabled = true,
  ttl = CACHE_TTL_MS,
  initialData,
}: UseOnDemandDataOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = globalDataCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return initialData ?? null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = globalDataCache.get(key);
    return !(cached && Date.now() - cached.timestamp < ttl);
  });

  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(
    async (forceRefetch = false) => {
      if (!enabled) return;

      const cached = globalDataCache.get(key);
      if (!forceRefetch && cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let result: T;
        if (fetcher) {
          result = await fetcher();
        } else if (url) {
          const response = await api.get(url);
          result = response.data;
        } else {
          throw new Error('Either fetcher or url must be provided to useOnDemandData');
        }

        if (mountedRef.current) {
          globalDataCache.set(key, { data: result, timestamp: Date.now() });
          setData(result);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [key, fetcher, url, enabled, ttl]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const invalidateCache = useCallback(() => {
    globalDataCache.delete(key);
  }, [key]);

  const refetch = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return { data, loading, error, refetch, invalidateCache };
}

export function clearAllOnDemandCache() {
  globalDataCache.clear();
}
