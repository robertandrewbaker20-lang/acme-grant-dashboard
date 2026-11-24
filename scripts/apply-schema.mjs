import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL");
  process.exit(1);
}

const schema = readFileSync(
  resolve(__dirname, "../supabase/schema.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString: connectionString.replace("sslmode=require", "sslmode=no-verify"),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(schema);
await client.end();

console.log("Database schema applied successfully.");