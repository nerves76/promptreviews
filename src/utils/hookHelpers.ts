import { useCallback, useEffect, useRef } from 'react';

/**
 * Utility functions to help with React Hook dependency management
 */

/**
 * Creates a stable callback that doesn't change on every render
 * Use this when you need a function in a dependency array but want to avoid re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);
  
  // Update the ref on every render but keep the same function reference
  useEffect(() => {
    ref.current = fn;
  });
  
  // Return a stable function that calls the latest version
  return useCallback(((...args: any[]) => {
    return ref.current(...args);
  }) as T, []);
}

/**
 * Like useEffect but with better handling of function dependencies
 * Automatically wraps function dependencies to make them stable
 */
export function useStableEffect(
  effect: () => void | (() => void),
  deps: any[]
) {
  const stableEffect = useStableCallback(effect);
  
  // Filter out functions from deps since they're now stable
  const stableDeps = deps.filter(dep => typeof dep !== 'function');
  
  useEffect(stableEffect, stableDeps);
}

/**
 * Debounced effect hook that delays execution
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: any[],
  delay: number = 300
) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, deps);
}

/**
 * Hook that calls a function only once, even if dependencies change
 */
export function useOnce(fn: () => void | (() => void)) {
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return fn();
    }
  }, []);
}