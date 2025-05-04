import Redis from 'ioredis';
import { env } from '@/env';

// Initialize Redis client
const redisClient = new Redis({
  host: env.REDIS_HOST || 'localhost',
  port: parseInt(env.REDIS_PORT || '6379'),
  password: env.REDIS_PASSWORD,
  db: parseInt(env.REDIS_DB || '0'),
  // Add connection retry options
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  // Fall back to in-memory cache if Redis is unavailable
});

/**
 * Redis-based cache implementation with TTL
 */
class RedisCache {
  private namespace: string;
  private defaultTTL: number;

  /**
   * Create a new Redis cache instance
   * @param namespace Namespace for this cache instance
   * @param defaultTTL Default time to live in seconds (default: 5 minutes)
   */
  constructor(namespace: string, defaultTTL: number = 300) {
    this.namespace = namespace;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get the full key with namespace
   * @param key Cache key
   * @returns Namespaced key
   */
  private getFullKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds (optional, uses default if not provided)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const ttlSeconds = ttl || this.defaultTTL;
    
    try {
      await redisClient.set(
        fullKey,
        JSON.stringify(value),
        'EX',
        ttlSeconds
      );
    } catch (error) {
      console.error('Redis set error:', error);
      // Fall back to in-memory cache if Redis fails
      fallbackCache.set(fullKey, value, ttlSeconds * 1000);
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found
   */
  async get(key: string): Promise<any> {
    const fullKey = this.getFullKey(key);
    
    try {
      const value = await redisClient.get(fullKey);
      
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get error:', error);
      // Fall back to in-memory cache if Redis fails
      return fallbackCache.get(fullKey);
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns True if the key exists
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    
    try {
      const exists = await redisClient.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      // Fall back to in-memory cache if Redis fails
      return fallbackCache.has(fullKey);
    }
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    
    try {
      await redisClient.del(fullKey);
    } catch (error) {
      console.error('Redis delete error:', error);
      // Fall back to in-memory cache if Redis fails
      fallbackCache.delete(fullKey);
    }
  }

  /**
   * Clear all items from this namespace
   */
  async clearNamespace(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.namespace}:*`);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear namespace error:', error);
      // Fall back to in-memory cache if Redis fails
      fallbackCache.clearNamespace(this.namespace);
    }
  }

  /**
   * Get or set a value in the cache using a factory function
   * @param key Cache key
   * @param factory Function to create the value if not in cache
   * @param ttl Time to live in seconds (optional)
   * @returns The cached or newly created value
   */
  async getOrSet(key: string, factory: () => Promise<any>, ttl?: number): Promise<any> {
    const cachedValue = await this.get(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Set multiple values in the cache
   * @param entries Array of [key, value] pairs
   * @param ttl Time to live in seconds (optional)
   */
  async mset(entries: [string, any][], ttl?: number): Promise<void> {
    if (entries.length === 0) return;
    
    try {
      const pipeline = redisClient.pipeline();
      
      for (const [key, value] of entries) {
        const fullKey = this.getFullKey(key);
        pipeline.set(fullKey, JSON.stringify(value), 'EX', ttl || this.defaultTTL);
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis mset error:', error);
      // Fall back to in-memory cache if Redis fails
      for (const [key, value] of entries) {
        const fullKey = this.getFullKey(key);
        fallbackCache.set(fullKey, value, (ttl || this.defaultTTL) * 1000);
      }
    }
  }

  /**
   * Get multiple values from the cache
   * @param keys Array of keys
   * @returns Array of values in the same order as keys
   */
  async mget(keys: string[]): Promise<any[]> {
    if (keys.length === 0) return [];
    
    try {
      const fullKeys = keys.map(key => this.getFullKey(key));
      const values = await redisClient.mget(...fullKeys);
      
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      // Fall back to in-memory cache if Redis fails
      return keys.map(key => fallbackCache.get(this.getFullKey(key)));
    }
  }

  /**
   * Increment a counter in the cache
   * @param key Cache key
   * @param increment Amount to increment (default: 1)
   * @param ttl Time to live in seconds (optional)
   * @returns The new value
   */
  async increment(key: string, increment: number = 1, ttl?: number): Promise<number> {
    const fullKey = this.getFullKey(key);
    
    try {
      let result: number;
      
      if (increment === 1) {
        result = await redisClient.incr(fullKey);
      } else {
        result = await redisClient.incrby(fullKey, increment);
      }
      
      if (ttl) {
        await redisClient.expire(fullKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fall back to in-memory cache if Redis fails
      const value = (fallbackCache.get(fullKey) || 0) + increment;
      fallbackCache.set(fullKey, value, ttl ? ttl * 1000 : undefined);
      return value;
    }
  }
}

/**
 * In-memory fallback cache for when Redis is unavailable
 */
class FallbackCache {
  private cache: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  set(key: string, value: any, ttl: number = 5 * 60 * 1000): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clearNamespace(namespace: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${namespace}:`)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance of the fallback cache
const fallbackCache = new FallbackCache();

// Set up automatic cleanup every hour
setInterval(() => {
  fallbackCache.cleanup();
}, 60 * 60 * 1000);

// Create cache instances for different parts of the application
export const userRedisCache = new RedisCache('user');
export const productRedisCache = new RedisCache('product');
export const genealogyRedisCache = new RedisCache('genealogy', 300); // 5 minutes TTL
export const rebateRedisCache = new RedisCache('rebate');

// Export Redis client for direct access if needed
export { redisClient };
