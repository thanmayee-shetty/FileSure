import { useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query. Falls back to `fallback` where
 * `matchMedia` is unavailable (SSR, older test environments).
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  return useSyncExternalStore(
    (onChange) => {
      if (!supported) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (supported ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}
