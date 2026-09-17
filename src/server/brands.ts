/**
 * 기준정보 브랜드 read 경로.
 *
 * 서버 전용이다. db는 src/server/db/index.ts의 neon-http 클라이언트를 그대로
 * 재사용하고 여기서 새 연결을 만들지 않는다. 읽기만 하며 쓰기 경로는 없다.
 */
import { asc } from "drizzle-orm";
import { db } from "./db/index.ts";
import { brands } from "./db/schema.ts";

/** 목록 표시에 필요한 최소 필드. */
export type BrandSummary = {
  id: string;
  displayName: string;
};

/** 브랜드를 표시 순서(POL26 · 디자인 ORDER)대로 읽는다. */
export async function getBrands(): Promise<BrandSummary[]> {
  return db
    .select({ id: brands.id, displayName: brands.displayName })
    .from(brands)
    .orderBy(asc(brands.displayOrder));
}
