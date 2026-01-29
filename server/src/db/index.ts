import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgres://user:password@localhost:5432/gradeval360",
});

await client.connect();
export const db = drizzle(client);