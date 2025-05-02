/**
 * A simple in-memory cache implementation with TTL (Time To Live)
 */
class Cache {
  private cache: Map<string, { value: any; expiry: number }>;
  private defaultTTL: number;

  /**
   * Create a new cache instance
   * @param defaultTTL Default time to live in milliseconds (default: 5 minutes)
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  set(key: string, value: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): any {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) return undefined;
    
    // Return undefined if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set a value in the cache using a factory function
   * @param key Cache key
   * @param factory Function to create the value if not in cache
   * @param ttl Time to live in milliseconds (optional)
   * @returns The cached or newly created value
   */
  async getOrSet(key: string, factory: () => Promise<any>, ttl?: number): Promise<any> {
    const cachedValue = this.get(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Remove all expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
export const cache = new Cache();

// Export a namespaced cache for different parts of the application
export const createNamespacedCache = (namespace: string) => {
  return {
    set: (key: string, value: any, ttl?: number) => 
      cache.set(`${namespace}:${key}`, value, ttl),
    
    get: (key: string) => 
      cache.get(`${namespace}:${key}`),
    
    has: (key: string) => 
      cache.has(`${namespace}:${key}`),
    
    delete: (key: string) => 
      cache.delete(`${namespace}:${key}`),
    
    getOrSet: (key: string, factory: () => Promise<any>, ttl?: number) => 
      cache.getOrSet(`${namespace}:${key}`, factory, ttl),
    
    clearNamespace: () => {
      for (const [key] of cache.cache.entries()) {
        if (key.startsWith(`${namespace}:`)) {
          cache.delete(key);
        }
      }
    }
  };
};

// Create namespaced caches for different parts of the application
export const userCache = createNamespacedCache('user');
export const productCache = createNamespacedCache('product');
export const genealogyCache = createNamespacedCache('genealogy');
export const rebateCache = createNamespacedCache('rebate');

// Set up automatic cleanup every hour
setInterval(() => {
  cache.cleanup();
}, 60 * 60 * 1000);
