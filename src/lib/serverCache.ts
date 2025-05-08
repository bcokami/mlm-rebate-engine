/**
 * Server-side caching utility for API routes
 * 
 * This module provides a simple in-memory cache for server-side operations.
 * It's designed to improve performance for frequently accessed data that
 * doesn't change often.
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class ServerCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;
  
  constructor(defaultTTL: number = 60 * 1000) { // Default TTL: 1 minute
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key The cache key
   * @returns True if the item was deleted, false if it wasn't found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get a value from the cache or compute it if not found
   * 
   * @param key The cache key
   * @param fn Function to compute the value if not in cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   * @returns The cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl: number = this.defaultTTL): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Get the number of items in the cache
   * 
   * @returns The number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Remove all expired items from the cache
   * 
   * @returns The number of items removed
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * 
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get all keys in the cache
   * 
   * @returns Array of all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get the remaining TTL for a key in milliseconds
   * 
   * @param key The cache key
   * @returns The remaining TTL in milliseconds, or -1 if the key doesn't exist or is expired
   */
  ttl(key: string): number {
    const item = this.cache.get(key);
    
    if (!item) {
      return -1;
    }
    
    const remaining = item.expiry - Date.now();
    
    if (remaining <= 0) {
      this.cache.delete(key);
      return -1;
    }
    
    return remaining;
  }
}

// Create a singleton instance
const serverCache = new ServerCache();

// Automatically prune expired items every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    serverCache.prune();
  }, 60 * 1000);
}

export default serverCache;
