import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it in server/.env.');
}

const client = new Client({ connectionString });

await client.connect();
export const db = drizzle(client);
