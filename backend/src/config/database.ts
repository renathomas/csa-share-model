import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/index.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/csa_management';

// Create the connection
const client = postgres(connectionString);

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for closing connection
export { client }; 