import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../lib/config';
import * as schema from './schema';

// Create postgres connection
const connectionString = config.database.url;
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
