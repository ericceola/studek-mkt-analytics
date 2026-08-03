import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(3000), DB_HOST: z.string().default('localhost'), DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('instagram_analytics'), DB_USER: z.string().default('instagram_app'), DB_PASSWORD: z.string().default(''),
  APIFY_TOKEN: z.string().default(''), APIFY_ACTOR_ID: z.string().default('apify/instagram-scraper'),
  JWT_SECRET: z.string().min(16).default('development-secret-change-me'), JWT_EXPIRES_IN: z.string().default('8h'),
  ADMIN_NAME: z.string().default('Administrador'), ADMIN_EMAIL: z.string().email().default('admin@studek.local'),
  ADMIN_PASSWORD: z.string().min(8).default('admin123'), FRONTEND_URL: z.string().default('http://localhost:5173'),
  COLLECTION_POLL_INTERVAL_SECONDS: z.coerce.number().min(5).default(20)
});
export const env = schema.parse(process.env);
