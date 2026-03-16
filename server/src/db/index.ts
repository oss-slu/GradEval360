import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://user:password@localhost:5432/gradeval360';

const client = new Client({ connectionString });

await client.connect();
export const db = drizzle(client);
