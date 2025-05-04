import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional(),
  
  // Cache settings
  CACHE_TTL: z.string().optional(),
  ENABLE_REDIS_CACHE: z.string().optional(),
  
  // Performance settings
  BATCH_SIZE: z.string().optional(),
  MAX_GENEALOGY_DEPTH: z.string().optional(),
  ENABLE_QUERY_LOGGING: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
});

/**
 * Parse environment variables
 */
function parseEnv() {
  // For server-side code, use process.env
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  
  // For client-side code, use a subset of environment variables
  const clientEnv = {
    // Add any client-safe environment variables here
  };
  
  // Combine environments based on context
  const combinedEnv = {
    ...clientEnv,
    ...processEnv,
  };
  
  // Parse and validate environment variables
  const result = envSchema.safeParse(combinedEnv);
  
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }
  
  return result.data;
}

/**
 * Parsed and validated environment variables
 */
export const env = parseEnv();

/**
 * Derived configuration values
 */
export const config = {
  // Cache settings
  cacheTTL: parseInt(env.CACHE_TTL || '300'), // 5 minutes in seconds
  enableRedisCache: env.ENABLE_REDIS_CACHE === 'true',
  
  // Performance settings
  batchSize: parseInt(env.BATCH_SIZE || '100'),
  maxGenealogyDepth: parseInt(env.MAX_GENEALOGY_DEPTH || '10'),
  enableQueryLogging: env.ENABLE_QUERY_LOGGING === 'true',
  
  // Rate limiting
  rateLimit: {
    max: parseInt(env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  },
};
