/**
 * 기준정보 seed: 브랜드 · 프로그램 · 단계 교환형 단계.
 *
 * 값의 원본은 05-policy.md POL26이다. 브랜드 slug와 표시 순서는 확정 디자인
 * `docs/design/cuppick -v2/CupPick v2.dc.html`의 META·ORDER를 따른다.
 * 여기서 새 정책이나 새 수치를 만들지 않는다.
 *
 * 사용자 데이터(users · stores · stamp_balances · coupons 등)는 넣지 않는다.
 * 같은 id로 다시 실행하면 갱신만 되므로 반복 실행해도 행이 늘지 않는다.
 *
 * Usage: npm run db:seed
 */
import { sql } from "drizzle-orm";
import { db } from "../src/server/db/index.ts";
import {
  brandProgramTiers,
  brandPrograms,
  brands,
} from "../src/server/db/schema.ts";

/** POL26 1항 표의 브랜드. displayOrder는 디자인 ORDER 순서다. */
const BRANDS = [
  { id: "compose", displayName: "컴포즈커피", displayOrder: 1 },
  { id: "mega", displayName: "메가MGC커피", displayOrder: 2 },
  { id: "paik", displayName: "빽다방", displayOrder: 3 },
  { id: "venti", displayName: "더벤티", displayOrder: 4 },
  { id: "mammoth", displayName: "매머드", displayOrder: 5 },
  { id: "uzi", displayName: "우지커피", displayOrder: 6 },
  { id: "tenpercent", displayName: "텐퍼센트커피", displayOrder: 7 },
] as const;

/**
 * POL26 1항 표의 프로그램.
 * - 단계 교환형은 단일 교환 기준을 갖지 않는다(chk_brand_programs_tiered_single_threshold).
 * - minStoreCount는 매장 조건형에서만 채운다(chk_brand_programs_min_store_scope).
 * - perStoreSeparated는 매장마다 별도 활성 잔액을 두는 매머드커피만 참이다.
 */
const BRAND_PROGRAMS = [
  {
    id: "compose-default",
    brandId: "compose",
    displayName: "기본",
    programType: "cumulative",
    exchangeThreshold: 10,
    minStoreCount: null,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "mega-default",
    brandId: "mega",
    displayName: "기본",
    programType: "cumulative",
    exchangeThreshold: 10,
    minStoreCount: null,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "paik-default",
    brandId: "paik",
    displayName: "기본",
    programType: "cumulative",
    exchangeThreshold: 10,
    minStoreCount: null,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "venti-default",
    brandId: "venti",
    displayName: "기본",
    programType: "cumulative",
    exchangeThreshold: 10,
    minStoreCount: null,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "mammoth-express",
    brandId: "mammoth",
    displayName: "매머드익스프레스",
    programType: "cumulative",
    exchangeThreshold: 10,
    minStoreCount: null,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "mammoth-coffee",
    brandId: "mammoth",
    displayName: "매머드커피",
    programType: "tiered",
    exchangeThreshold: null,
    minStoreCount: null,
    perStoreSeparated: true,
    displayOrder: 2,
  },
  {
    id: "uzi-default",
    brandId: "uzi",
    displayName: "기본",
    programType: "store_conditional",
    exchangeThreshold: 10,
    minStoreCount: 3,
    perStoreSeparated: false,
    displayOrder: 1,
  },
  {
    id: "tenpercent-default",
    brandId: "tenpercent",
    displayName: "기본",
    programType: "store_conditional",
    exchangeThreshold: 10,
    minStoreCount: 3,
    perStoreSeparated: false,
    displayOrder: 1,
  },
] as const;

/** POL26 2항: 매머드커피 12개 아메리카노 쿠폰 · 20개 모든 음료 쿠폰. */
const BRAND_PROGRAM_TIERS = [
  {
    brandProgramId: "mammoth-coffee",
    stepNo: 1,
    threshold: 12,
    rewardName: "아메리카노 쿠폰",
  },
  {
    brandProgramId: "mammoth-coffee",
    stepNo: 2,
    threshold: 20,
    rewardName: "모든 음료 쿠폰",
  },
] as const;

async function main(): Promise<void> {
  await db
    .insert(brands)
    .values([...BRANDS])
    .onConflictDoUpdate({
      target: brands.id,
      set: {
        displayName: sql`excluded.display_name`,
        displayOrder: sql`excluded.display_order`,
        updatedAt: sql`now()`,
      },
    });
  console.log(`brands              : ${BRANDS.length} rows upserted`);

  await db
    .insert(brandPrograms)
    .values([...BRAND_PROGRAMS])
    .onConflictDoUpdate({
      target: brandPrograms.id,
      set: {
        brandId: sql`excluded.brand_id`,
        displayName: sql`excluded.display_name`,
        programType: sql`excluded.program_type`,
        exchangeThreshold: sql`excluded.exchange_threshold`,
        minStoreCount: sql`excluded.min_store_count`,
        perStoreSeparated: sql`excluded.per_store_separated`,
        displayOrder: sql`excluded.display_order`,
        updatedAt: sql`now()`,
      },
    });
  console.log(`brand_programs      : ${BRAND_PROGRAMS.length} rows upserted`);

  await db
    .insert(brandProgramTiers)
    .values([...BRAND_PROGRAM_TIERS])
    .onConflictDoUpdate({
      target: [brandProgramTiers.brandProgramId, brandProgramTiers.stepNo],
      set: {
        threshold: sql`excluded.threshold`,
        rewardName: sql`excluded.reward_name`,
      },
    });
  console.log(`brand_program_tiers : ${BRAND_PROGRAM_TIERS.length} rows upserted`);
}

main().catch((error: unknown) => {
  // 드라이버 error 객체는 connection string을 품을 수 있어 message만 남긴다.
  console.error("DB seed FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
