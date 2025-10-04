import { z } from 'zod';

// Environment variables schema with validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8000').transform(val => parseInt(val, 10)),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_HOURS: z.string().default('8').transform(val => parseInt(val, 10)),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT: z.string().default('100/minute'),
  BCRYPT_ROUNDS: z.string().default('12').transform(val => parseInt(val, 10)),
  // Cloudinary Configuration (optional for development)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CLOUDINARY_FOLDER: z.string().default('ecommerce/products'),
});

// Parse and validate environment variables
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const env = parseEnv();

export type Env = typeof env;
