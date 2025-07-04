import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/models/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/csa_management',
  },
}); 