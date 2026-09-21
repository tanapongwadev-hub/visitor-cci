// TEMP helper — used only to create/drop a scratch DB for generating the initial migration.
// Safe to delete.
import pg from "pg";

const action = process.argv[2];
const target = process.argv[3];

const base = process.env.DATABASE_URL;
if (!base) throw new Error("DATABASE_URL missing");

// connect to the maintenance db, not the target
const adminUrl = base.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();

if (action === "create") {
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [target]);
  if (rows.length) {
    await client.query(`DROP DATABASE "${target}"`);
  }
  await client.query(`CREATE DATABASE "${target}"`);
  console.log(`created ${target}`);
} else if (action === "drop") {
  await client.query(`DROP DATABASE IF EXISTS "${target}"`);
  console.log(`dropped ${target}`);
} else if (action === "tables") {
  const c2 = new pg.Client({ connectionString: base });
  await c2.connect();
  const { rows } = await c2.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  );
  console.log("tables in current DATABASE_URL: " + rows.map((r) => r.table_name).join(", "));
  await c2.end();
}

await client.end();
