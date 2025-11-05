import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Preload a lazy component before it's needed
 * Useful for prefetching on hover or other interactions
 * 
 * @param importFn - Function that returns a dynamic import
 * @returns Promise that resolves when the component is loaded
 * 
 * @example
 * const preloadDashboard = () => preload(() => import('../pages/Dashboard'));
 * <Link onMouseEnter={preloadDashboard}>Dashboard</Link>
 */
export function preload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn();
}

/**
 * Create a lazy loaded component with enhanced error handling
 * 
 * @param importFn - Function that returns a dynamic import
 * @param componentName - Name of the component for debugging (optional)
 * @returns A lazy loaded component
 * 
 * @example
 * const LazyDashboard = createLazyComponent(() => import('../pages/Dashboard'), 'Dashboard');
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName?: string
): LazyExoticComponent<T> {
  const LazyComponent = lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error(`Failed to load component ${componentName || 'Unknown'}:`, error);
      throw error;
    }
  });

  // Store component name for debugging (can't set displayName on LazyExoticComponent)
  if (componentName && process.env.NODE_ENV === 'development') {
    // Store in a custom property for debugging
    (LazyComponent as any)._componentName = componentName;
  }

  return LazyComponent;
}

