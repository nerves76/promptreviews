/**
 * Caching Utility for Production
 * 
 * This utility provides caching strategies for API responses
 * to improve performance and reduce database load.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum number of entries

  set(key: string, data: any, ttl: number = 300000): void {
    // Clean up expired entries
    this.cleanup();
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cache key generators
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// Cache decorator for API routes
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  ttl: number = 300000, // 5 minutes default
  keyGenerator?: (...args: T) => string
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator 
      ? `${keyPrefix}:${keyGenerator(...args)}`
      : `${keyPrefix}:${JSON.stringify(args)}`;
    
    // Try to get from cache
    const cached = cache.get(key);
    if (cached) {
      return cached as R;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  };
}

// Cache middleware for Next.js API routes
export function cacheMiddleware(
  ttl: number = 300000,
  keyPrefix?: string
) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      if (req.method !== 'GET') {
        return handler(req, res);
      }
      
      const prefix = keyPrefix || `${req.url}`;
      const key = generateCacheKey(prefix, req.query);
      
      // Try to get from cache
      const cached = cache.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data: any) {
        cache.set(key, data, ttl);
        return originalJson.call(this, data);
      };
      
      return handler(req, res);
    };
  };
}

// Cache headers helper
export function setCacheHeaders(
  response: Response,
  maxAge: number = 300,
  staleWhileRevalidate: number = 600
): void {
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
}

// Cache invalidation
export function invalidateCache(pattern: string): void {
  for (const key of cache['cache'].keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Cache statistics
export function getCacheStats() {
  return cache.getStats();
}

const cacheUtils = {
  generateCacheKey,
  withCache,
  cacheMiddleware,
  setCacheHeaders,
  invalidateCache,
  getCacheStats,
};

export default cacheUtils; 