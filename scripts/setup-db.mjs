import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();

if (!accessToken || !projectRef) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.\n" +
      "The project ref is the subdomain of your database API host.\n" +
      "Create a token in the Supabase account settings.",
  );
  process.exit(1);
}

if (!/^[a-z0-9]{20}$/.test(projectRef)) {
  console.error("SUPABASE_PROJECT_REF should be 20 lowercase letters or digits.");
  process.exit(1);
}

const schema = readFileSync(resolve(__dirname, "../supabase/schema.sql"), "utf8");

const apiHost = ["https://api.", "supabase", ".com"].join("");
const res = await fetch(
  `${apiHost}/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: schema }),
  },
);

if (!res.ok) {
  const body = await res.text();
  console.error(`Schema request failed (${res.status}).`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

console.log("Database schema applied.");
