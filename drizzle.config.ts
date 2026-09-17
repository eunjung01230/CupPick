import { defineConfig } from "drizzle-kit";

// `generate`는 DB에 접속하지 않고 schema.ts만 읽는다.
// `migrate`/`push`/`studio`만 dbCredentials를 사용한다.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
