import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/csa_management';
  
  console.log('🔄 Running database migrations...');

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const migrationClient = postgres(connectionString, { max: 1 });
  
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle' });
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  await migrationClient.end();
}

main().catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
}); 