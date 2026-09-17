/**
 * Read-only connectivity check against the Neon development database.
 * Creates nothing and writes nothing: it only proves that DATABASE_URL
 * resolves to a reachable PostgreSQL instance.
 *
 * Usage: npm run db:smoke
 */
import { sql } from "drizzle-orm";
import { db } from "../src/server/db/index.ts";

type SmokeRow = {
  ok: number;
  server_version: string;
  database_name: string;
};

async function main(): Promise<void> {
  const result = await db.execute<SmokeRow>(
    sql`select 1 as ok, version() as server_version, current_database() as database_name`,
  );

  const row = result.rows.at(0);

  if (!row || row.ok !== 1) {
    throw new Error(
      `Unexpected smoke test result: ${result.rows.length} row(s) returned.`,
    );
  }

  console.log("query        : OK (select 1)");
  console.log(`database     : ${row.database_name}`);
  console.log(`server       : ${row.server_version}`);
}

main().catch((error: unknown) => {
  // Only the message is printed: a driver error object can carry the
  // connection string, which must never reach the log.
  console.error("DB smoke test FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
