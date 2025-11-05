/**
 * Prefetch utilities for lazy loaded components
 * Prefetches components when user hovers over navigation links
 */

// Map of routes to their import functions
const routePrefetchMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/pumps': () => import('../pages/Pumps'),
  '/transactions': () => import('../pages/Transactions'),
  '/login': () => import('../pages/Login'),
};

// Track which routes have been prefetched to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route component
 * @param path - Route path to prefetch
 */
export function prefetchRoute(path: string): void {
  // Skip if already prefetched or path doesn't exist
  if (prefetchedRoutes.has(path) || !routePrefetchMap[path]) {
    return;
  }

  // Mark as prefetched immediately to prevent race conditions
  prefetchedRoutes.add(path);

  // Prefetch the component
  routePrefetchMap[path]().catch((error) => {
    // On error, remove from prefetched set so we can retry
    prefetchedRoutes.delete(path);
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to prefetch route ${path}:`, error);
    }
  });
}

/**
 * Prefetch all routes (useful for preloading critical routes)
 */
export function prefetchAllRoutes(): void {
  Object.keys(routePrefetchMap).forEach((path) => {
    prefetchRoute(path);
  });
}

/**
 * Prefetch critical routes only (dashboard, pumps, transactions)
 */
export function prefetchCriticalRoutes(): void {
  prefetchRoute('/dashboard');
  prefetchRoute('/pumps');
  prefetchRoute('/transactions');
}

/**
 * Check if a route has been prefetched
 */
export function isRoutePrefetched(path: string): boolean {
  return prefetchedRoutes.has(path);
}

