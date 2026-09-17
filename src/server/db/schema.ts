/**
 * CupPick 물리 스키마.
 *
 * 기준 문서
 * - docs/06-data.md v1.3 (D01~D22 논리 명세)
 * - docs/05-policy.md v1.3 (POL01~POL26)
 * - docs/04-features.md v1.4 (F01~F35)
 * - docs/design/cuppick -v2/CupPick v2.dc.html (최종 디자인, 최우선)
 *
 * 이번 범위는 계정 · 브랜드/프로그램 · 매장 · 저장한 장소 · 스탬프 · 쿠폰 ·
 * 쿠폰 매장 스냅샷이다. D08(묶음) · D12(배분) · D13(보류) · D14(휴지통 항목) ·
 * D15(첨부) · D16~D22는 해당 기능 구현 시점에 추가한다.
 *
 * Drizzle DSL로 표현하지 못해 별도 처리가 필요한 제약은 파일 하단 주석에 모아 두었다.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * CHECK 식에는 bind parameter를 넣을 수 없다. 숫자를 템플릿에 그대로 끼우면
 * $1로 직렬화되어 DDL이 깨지므로 리터럴로 전개한다.
 */
const n = (value: number) => sql.raw(String(value));

/**
 * text({ enum }) 는 TypeScript 타입만 좁힐 뿐 DB에는 아무 제약도 만들지 않는다.
 * 같은 배열로 CHECK을 만들어 DB에서도 값 집합을 강제한다.
 *
 * PostgreSQL enum 타입 대신 text + CHECK을 쓰는 이유는 값 추가·제거가
 * 트랜잭션 가능한 단일 migration으로 끝나기 때문이다. 06 §9가 정책 변경 가능성을
 * 이유로 과도하게 고정된 schema를 피하라고 규정한다.
 *
 * NULL은 CHECK을 통과한다. nullable 열거 컬럼(program_type 등)에 그대로 쓴다.
 */
const inList = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

/** 05-policy.md §4.1 입력 한도 */
const QTY_MAX = 999_999;
const TEXT_SHORT_MAX = 100;
const TEXT_LONG_MAX = 2_000;
/** 05 POL03.5 · 06 D03: 계정당 저장한 장소 최대 개수 */
const SAVED_PLACE_MAX = 10;

/**
 * 06 §0: 사건 시각은 시간대 있는 절대시각으로 보관한다.
 * 한국 달력 날짜(만료일)는 date 컬럼으로 따로 다룬다.
 */
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ────────────────────────────── 열거 값 ────────────────────────────── */

/** 06 D04 기준정보 상태 */
export const REFERENCE_STATUS = ["confirmed", "unconfirmed", "suspended"] as const;

/** 05 POL26 · 04 §0.1 프로그램 유형. 미확인 프로그램은 NULL로 둔다. */
export const PROGRAM_TYPE = ["cumulative", "store_conditional", "tiered"] as const;

/** 06 D06 매장 정보 상태 */
export const STORE_STATUS = ["active", "closed_confirmed", "needs_check"] as const;

/** 05 POL02.2 제공자별 계정 */
export const AUTH_PROVIDER = ["google", "naver", "kakao"] as const;

/** 06 D01 계정 상태 */
export const USER_STATUS = ["active", "withdrawing"] as const;

/** 05 POL06.1 적립 범위 */
export const ACCRUAL_SCOPE = ["common", "store", "unknown"] as const;

/** 06 D07 구성 확인 상태 */
export const COMPOSITION_STATUS = ["valid", "needs_check"] as const;

/**
 * 06 D11 사건종류. 05 POL07 · POL10 · POL11 · POL12의 갱신 축을 옮긴 것이며
 * 화면 표시 상태와 무관하다.
 */
export const STAMP_EVENT_TYPE = [
  "initial_import",
  "accrual_added",
  "balance_set",
  "official_confirmed",
  "expired",
  "expiry_restored",
  "converted",
  "conversion_cancelled",
  "deleted",
  "restored",
] as const;

/** 06 D11 반영방법 */
export const APPLIED_VIA = ["direct", "already_reflected", "balance_reconciled"] as const;

/** 05 POL13.1 쿠폰 종류 */
export const COUPON_KIND = ["stamp", "event_other", "unknown"] as const;

/**
 * 05 POL13.3 쿠폰 생애. 화면의 6종 표시 상태(기록됨/아직 사용 불가/사용 가능/
 * 만료 임박/사용 완료/만료)는 저장하지 않고 생애 + 날짜 신뢰 + usable_from에서
 * 계산한다(POL13.5 · 06 §6).
 */
export const COUPON_LIFECYCLE = ["held", "used", "expired", "conversion_cancelled"] as const;

/** 05 POL09.1 날짜 신뢰 */
export const DATE_TRUST = ["confirmed", "estimated", "unknown", "no_limit"] as const;

/**
 * 05 POL09.5: 빽다방은 날짜 단위, 메가MGC는 분 단위로 사용 시작 시점이 정해진다.
 * 값은 usable_from 하나에 담고 표시 문구만 이 판별자로 나눈다.
 */
export const USABLE_FROM_PRECISION = ["date", "minute"] as const;

/** 06 D10 목록완전성 */
export const LIST_COMPLETENESS = ["complete", "partial", "unknown"] as const;

/* ──────────────────────── 공통 기준정보 (D04 · D06) ──────────────────────── */

/**
 * D04 브랜드. 05 POL26의 1차 지원 7개.
 * PK는 표시 이름과 무관한 고정 slug다(06 §0). 이름 변경은 ID 변경이 아니다.
 * 배지 색 · 약칭 같은 표현 값은 D04의 칸이 아니므로 클라이언트가 갖는다.
 */
export const brands = pgTable(
  "brands",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    displayOrder: smallint("display_order").notNull(),
    referenceStatus: text("reference_status", { enum: REFERENCE_STATUS })
      .notNull()
      .default("confirmed"),
    ...timestamps,
  },
  (t) => [
    unique("uq_brands_display_name").on(t.displayName),
    index("ix_brands_display_order").on(t.displayOrder),
    check("chk_brands_reference_status", inList(t.referenceStatus, REFERENCE_STATUS)),
    check(
      "chk_brands_display_name_len",
      sql`char_length(${t.displayName}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/**
 * D04 프로그램. 매머드익스프레스와 매머드커피를 갈라 놓는 자리다(POL26.3).
 * program_type이 nullable인 것이 중요하다 — 06 §3 D04는 미확인 프로그램을
 * "유형 없음"으로 두고 자동 계산 대상에서 제외하라고 규정한다.
 */
export const brandPrograms = pgTable(
  "brand_programs",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    displayName: text("display_name").notNull(),
    programType: text("program_type", { enum: PROGRAM_TYPE }),
    /** 누적형 · 매장 조건형의 단일 교환 기준. 단계 교환형은 brand_program_tiers를 쓴다. */
    exchangeThreshold: integer("exchange_threshold"),
    /** 매장 조건형에서 그 매장 쿠폰을 쓰기 위해 필요한 최소 적립 수(POL26: 3) */
    minStoreCount: integer("min_store_count"),
    /** 참이면 매장마다 별도 활성 잔액(매머드커피). POL06.6 */
    perStoreSeparated: boolean("per_store_separated").notNull().default(false),
    referenceStatus: text("reference_status", { enum: REFERENCE_STATUS })
      .notNull()
      .default("confirmed"),
    displayOrder: smallint("display_order").notNull(),
    ...timestamps,
  },
  (t) => [
    unique("uq_brand_programs_brand_name").on(t.brandId, t.displayName),
    index("ix_brand_programs_brand_order").on(t.brandId, t.displayOrder),
    check("chk_brand_programs_program_type", inList(t.programType, PROGRAM_TYPE)),
    check("chk_brand_programs_reference_status", inList(t.referenceStatus, REFERENCE_STATUS)),
    check(
      "chk_brand_programs_name_len",
      sql`char_length(${t.displayName}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
    // 단계 교환형은 단일 기준값을 갖지 않는다. 교환 기준 자체는 "확인된 경우"에만
    // 채우므로(06 D04) NOT NULL로 강제하지 않는다.
    check(
      "chk_brand_programs_tiered_single_threshold",
      sql`not (${t.programType} = 'tiered' and ${t.exchangeThreshold} is not null)`,
    ),
    check(
      "chk_brand_programs_min_store_scope",
      sql`${t.minStoreCount} is null or ${t.programType} = 'store_conditional'`,
    ),
    check(
      "chk_brand_programs_threshold_range",
      sql`${t.exchangeThreshold} is null or ${t.exchangeThreshold} between 1 and ${n(QTY_MAX)}`,
    ),
    check(
      "chk_brand_programs_min_store_range",
      sql`${t.minStoreCount} is null or ${t.minStoreCount} >= 1`,
    ),
  ],
);

/**
 * D04 단계 교환형의 단계 목록. 06 §3 D04가 "오름차순 단계 목록과 단계별 혜택 이름"을
 * 요구하므로 integer[]가 아니라 별도 테이블이다.
 * 매머드커피: 12 → 아메리카노 쿠폰, 20 → 모든 음료 쿠폰.
 */
export const brandProgramTiers = pgTable(
  "brand_program_tiers",
  {
    brandProgramId: text("brand_program_id")
      .notNull()
      .references(() => brandPrograms.id, { onDelete: "cascade" }),
    stepNo: smallint("step_no").notNull(),
    threshold: integer("threshold").notNull(),
    rewardName: text("reward_name").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.brandProgramId, t.stepNo] }),
    unique("uq_brand_program_tiers_threshold").on(t.brandProgramId, t.threshold),
    check("chk_brand_program_tiers_step_no", sql`${t.stepNo} >= 1`),
    check("chk_brand_program_tiers_threshold", sql`${t.threshold} between 1 and ${n(QTY_MAX)}`),
    check(
      "chk_brand_program_tiers_reward_len",
      sql`char_length(${t.rewardName}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/**
 * D06 매장. brand_program_id가 매머드 매장을 커피/익스프레스로 가르는 자리다.
 * 06 §3 D06: 프로그램 미확인 매장을 특정 프로그램의 적립·사용 후보로 확정하지 않는다.
 * 폐점은 행 삭제가 아니라 store_status로 표시한다(POL15.2, 폐점으로 혜택 삭제 금지).
 */
export const stores = pgTable(
  "stores",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    brandId: text("brand_id").references(() => brands.id),
    brandProgramId: text("brand_program_id").references(() => brandPrograms.id),
    name: text("name").notNull(),
    address: text("address"),
    /** numeric은 JS에서 string으로 매핑된다. 좌표는 합산하지 않고 그대로 전달만 한다. */
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 10, scale: 6 }),
    mapProvider: text("map_provider"),
    providerPlaceId: text("provider_place_id"),
    storeStatus: text("store_status", { enum: STORE_STATUS }).notNull().default("active"),
    source: text("source"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    previousStoreId: uuid("previous_store_id").references((): AnyPgColumn => stores.id),
    ...timestamps,
  },
  (t) => [
    // D06: 공급자별 장소ID 고유. 둘 다 NULL인 직접 입력 매장은 PG의 NULL distinct
    // 규칙에 따라 여러 건 공존한다(의도한 동작, POL15.2).
    unique("uq_stores_provider_place").on(t.mapProvider, t.providerPlaceId),
    index("ix_stores_brand_program").on(t.brandProgramId),
    index("ix_stores_brand").on(t.brandId),
    check("chk_stores_store_status", inList(t.storeStatus, STORE_STATUS)),
    check("chk_stores_name_len", sql`char_length(${t.name}) between 1 and ${n(TEXT_SHORT_MAX)}`),
    check("chk_stores_latitude", sql`${t.latitude} is null or ${t.latitude} between -90 and 90`),
    check(
      "chk_stores_longitude",
      sql`${t.longitude} is null or ${t.longitude} between -180 and 180`,
    ),
    check("chk_stores_coords_paired", sql`(${t.latitude} is null) = (${t.longitude} is null)`),
  ],
);

/* ──────────────────────────── 계정 (D01 · D03) ──────────────────────────── */

/**
 * D01 사용자 계정.
 *
 * email · 이름 · 프로필 이미지를 저장하지 않는다.
 * POL02.2 "같은 이메일로 병합하지 않는다", 06 §3 D01 "이메일을 병합키로 쓰지 않음",
 * "불필요한 프로필은 저장하지 않는다". 모든 개인 데이터의 FK는 이 표의 uuid를 가리킨다.
 *
 * Better Auth 도입 시에는 인증 테이블을 별도로 두고 여기에 링크 컬럼 하나만 추가한다.
 * 도메인 FK가 인증 구현을 가리키지 않게 유지한다.
 *
 * 운영 삭제 기한은 컬럼이 아니다. withdrawal_requested_at + 24시간으로 파생된다(D01).
 * 탈퇴는 60일 휴지통 대상이 아니다(POL22.4).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    authProvider: text("auth_provider", { enum: AUTH_PROVIDER }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    status: text("status", { enum: USER_STATUS }).notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    withdrawalRequestedAt: timestamp("withdrawal_requested_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("uq_users_provider_subject").on(t.authProvider, t.providerSubject),
    check("chk_users_auth_provider", inList(t.authProvider, AUTH_PROVIDER)),
    check("chk_users_status", inList(t.status, USER_STATUS)),
    check(
      "chk_users_withdrawal_consistency",
      sql`(${t.status} = 'withdrawing') = (${t.withdrawalRequestedAt} is not null)`,
    ),
  ],
);

/**
 * D03 저장한 장소. 계정당 최대 10개(POL03.5).
 *
 * 개수 제한을 슬롯 도메인으로 환원했다. display_order가 1~10만 허용되고
 * (user_id, display_order)가 유일하므로 11번째 행은 삽입 자체가 불가능하다.
 * 트리거 없이 DB가 한도를 보장하며 동시 요청 경쟁에도 안전하다.
 *
 * 순서 재배열은 중간 상태에서 일시적으로 중복이 생기므로 이 유니크 제약이
 * DEFERRABLE이어야 한다. Drizzle DSL이 DEFERRABLE을 표현하지 못한다(하단 주석 1번).
 *
 * 휴지통 대상이 아니다 — 06 §7 "D03 저장한 장소 자식행만 제거"(POL03.6).
 */
export const savedPlaces = pgTable(
  "saved_places",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
    displayOrder: smallint("display_order").notNull(),
    ...timestamps,
  },
  (t) => [
    unique("uq_saved_places_user_slot").on(t.userId, t.displayOrder),
    check(
      "chk_saved_places_name_len",
      sql`char_length(${t.name}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
    check(
      "chk_saved_places_slot_range",
      sql`${t.displayOrder} between 1 and ${n(SAVED_PLACE_MAX)}`,
    ),
    check("chk_saved_places_latitude", sql`${t.latitude} between -90 and 90`),
    check("chk_saved_places_longitude", sql`${t.longitude} between -180 and 180`),
  ],
);

/* ───────────────────────────── 스탬프 (D07 · D11) ───────────────────────────── */

/**
 * D07 현재 스탬프 잔액. 이것이 수량의 원본이며 사건 합계로 계산하지 않는다.
 * 06 §5.5 "D11 내역삭제는 잔액을 역산하지 않는다"가 event sourcing을 금지한다.
 *
 * 프로그램 유형별 형태
 * - 누적형: accrual_scope='common', store 없음, 자식행 없음
 * - 매장 조건형(우지·텐퍼센트): accrual_scope='store', store 없음,
 *   stamp_balance_store_counts 자식행으로 매장별 수량 관리
 * - 단계 교환형 매장 분리(매머드커피): accrual_scope='store', store 지정,
 *   매장마다 별도 행. 자식행 없음
 */
export const stampBalances = pgTable(
  "stamp_balances",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    /** 모르면 NULL. 이때 unidentified_key가 필수가 된다(POL06.2). */
    brandProgramId: text("brand_program_id").references(() => brandPrograms.id),
    /** 용도(교환용 등). 값 집합이 문서에서 확정되지 않아 CHECK을 걸지 않는다. */
    purpose: text("purpose"),
    accrualScope: text("accrual_scope", { enum: ACCRUAL_SCOPE }).notNull(),
    storeId: uuid("store_id").references(() => stores.id),
    /** 지도 미연결 매장의 직접 입력 이름(POL15.2) */
    storeNameRaw: text("store_name_raw"),
    /** D07 미확인 구분ID. NULL끼리 같은 잔액으로 합쳐지지 않도록 구별한다. */
    unidentifiedKey: text("unidentified_key"),
    currentQuantity: integer("current_quantity").notNull(),
    officialQuantity: integer("official_quantity"),
    officialCheckedAt: timestamp("official_checked_at", { withTimezone: true }),
    compositionStatus: text("composition_status", { enum: COMPOSITION_STATUS })
      .notNull()
      .default("valid"),
    compositionCheckedAt: timestamp("composition_checked_at", { withTimezone: true }),
    /** 06 G1 낙관적 동시성. UPDATE ... WHERE version = ? 로 VERSION_CONFLICT를 판정한다. */
    version: integer("version").notNull().default(1),
    /** 사용자 삭제 휴지통. purge 기준은 deleted_at + 60일(POL18.3). */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // 자식행의 복합 FK가 참조할 대상
    unique("uq_stamp_balances_id_user").on(t.id, t.userId),

    // POL06.1 활성 잔액 식별 단위 고유성.
    // 06 §10.2가 "서버 데이터 제약으로 보장한다"고 직접 지시한 부분이다.
    // 키에 nullable 컬럼이 들어가면 PG가 NULL을 서로 다르게 보아 중복이 새므로,
    // 매장 식별 형태에 따라 세 개의 부분 유니크 인덱스로 나눠 키를 항상 NOT NULL로 만든다.
    uniqueIndex("uq_stamp_balance_unit_no_store")
      .on(t.userId, t.brandId, t.brandProgramId, t.purpose, t.accrualScope)
      .where(
        sql`${t.deletedAt} is null and ${t.brandProgramId} is not null and ${t.purpose} is not null and ${t.accrualScope} <> 'unknown' and ${t.storeId} is null and ${t.storeNameRaw} is null`,
      ),
    uniqueIndex("uq_stamp_balance_unit_store_id")
      .on(t.userId, t.brandId, t.brandProgramId, t.purpose, t.accrualScope, t.storeId)
      .where(
        sql`${t.deletedAt} is null and ${t.brandProgramId} is not null and ${t.purpose} is not null and ${t.accrualScope} <> 'unknown' and ${t.storeId} is not null`,
      ),
    uniqueIndex("uq_stamp_balance_unit_store_name")
      .on(t.userId, t.brandId, t.brandProgramId, t.purpose, t.accrualScope, t.storeNameRaw)
      .where(
        sql`${t.deletedAt} is null and ${t.brandProgramId} is not null and ${t.purpose} is not null and ${t.accrualScope} <> 'unknown' and ${t.storeNameRaw} is not null`,
      ),
    // POL06.2 미확인 단위끼리 병합 금지
    uniqueIndex("uq_stamp_balance_unidentified")
      .on(t.userId, t.unidentifiedKey)
      .where(sql`${t.deletedAt} is null and ${t.unidentifiedKey} is not null`),

    index("ix_stamp_balances_user")
      .on(t.userId)
      .where(sql`${t.deletedAt} is null`),
    index("ix_stamp_balances_user_brand")
      .on(t.userId, t.brandId)
      .where(sql`${t.deletedAt} is null`),
    index("ix_stamp_balances_deleted")
      .on(t.deletedAt)
      .where(sql`${t.deletedAt} is not null`),

    check("chk_stamp_balances_accrual_scope", inList(t.accrualScope, ACCRUAL_SCOPE)),
    check("chk_stamp_balances_composition_status", inList(t.compositionStatus, COMPOSITION_STATUS)),
    check(
      "chk_stamp_balances_current_quantity",
      sql`${t.currentQuantity} between 0 and ${n(QTY_MAX)}`,
    ),
    check(
      "chk_stamp_balances_official_quantity",
      sql`${t.officialQuantity} is null or ${t.officialQuantity} between 0 and ${n(QTY_MAX)}`,
    ),
    // POL07.2 공식 확인 수량과 확인 시점은 함께 존재한다.
    check(
      "chk_stamp_balances_official_pair",
      sql`(${t.officialQuantity} is null) = (${t.officialCheckedAt} is null)`,
    ),
    // 매장은 연결 ID이거나 직접 입력 이름이거나, 최대 하나만 갖는다.
    check(
      "chk_stamp_balances_store_identity",
      sql`num_nonnulls(${t.storeId}, ${t.storeNameRaw}) <= 1`,
    ),
    check(
      "chk_stamp_balances_store_scope",
      sql`(${t.storeId} is null and ${t.storeNameRaw} is null) or ${t.accrualScope} = 'store'`,
    ),
    // POL06.2: 식별 요소가 하나라도 비면 미확인 구분ID가 있어야 한다.
    check(
      "chk_stamp_balances_unidentified_key",
      sql`(${t.brandProgramId} is not null and ${t.purpose} is not null and ${t.accrualScope} <> 'unknown') or ${t.unidentifiedKey} is not null`,
    ),
    check(
      "chk_stamp_balances_store_name_len",
      sql`${t.storeNameRaw} is null or char_length(${t.storeNameRaw}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/**
 * D07 자식행: 매장 조건형 잔액의 매장별 적립 수량(우지커피 · 텐퍼센트커피).
 *
 * 매장별 합계 = 부모의 current_quantity 불변식(POL06.5 · 06 §5.9)은 다중 행 집계라
 * CHECK으로 표현할 수 없다. 쓰기 트랜잭션 안에서 application이 검증한다.
 *
 * 복합 FK가 06 §10.2 "모든 개인 자식 참조는 부모와 계정이 같아야 한다"를 DB로 강제한다.
 */
export const stampBalanceStoreCounts = pgTable(
  "stamp_balance_store_counts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    stampBalanceId: uuid("stamp_balance_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id),
    storeNameRaw: text("store_name_raw"),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.stampBalanceId, t.userId],
      foreignColumns: [stampBalances.id, stampBalances.userId],
      name: "fk_balance_store_counts_balance",
    }).onDelete("cascade"),
    // 한 잔액 안에서 같은 매장이 두 줄로 들어가지 않게 한다.
    uniqueIndex("uq_balance_store_counts_store_id")
      .on(t.stampBalanceId, t.storeId)
      .where(sql`${t.storeId} is not null`),
    uniqueIndex("uq_balance_store_counts_store_name")
      .on(t.stampBalanceId, t.storeNameRaw)
      .where(sql`${t.storeNameRaw} is not null`),
    check("chk_balance_store_counts_quantity", sql`${t.quantity} between 0 and ${n(QTY_MAX)}`),
    check(
      "chk_balance_store_counts_store_identity",
      sql`num_nonnulls(${t.storeId}, ${t.storeNameRaw}) = 1`,
    ),
    check(
      "chk_balance_store_counts_store_name_len",
      sql`${t.storeNameRaw} is null or char_length(${t.storeNameRaw}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/**
 * D11 변경 사건. 최초 보유 상태 등록과 이후 갱신을 구분하는 원장이다.
 *
 * occurred_at(실제 행위 시각)과 recorded_at(서버 기록 시각)을 나눈 근거는
 * 06 §3 D11 "공식 실제 행위 시각과 기록 시각이 다르면 구분"이다.
 * 최초 등록은 존재하지 않는 과거 적립일을 지어내지 않는다(06 §0 · F08).
 *
 * 수명이 둘이다: 사용자 삭제는 deleted_at + 60일(POL18.3),
 * 일반 이력 자동 정리는 recorded_at + 365일(POL19.3).
 */
export const stampEvents = pgTable(
  "stamp_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stampBalanceId: uuid("stamp_balance_id"),
    eventType: text("event_type", { enum: STAMP_EVENT_TYPE }).notNull(),
    /** 내역 삭제 · 숫자 확인은 변화량 0, 수량 사건이 아니면 NULL(D11). */
    quantityDelta: integer("quantity_delta"),
    quantityBefore: integer("quantity_before"),
    quantityAfter: integer("quantity_after"),
    targetVersion: integer("target_version"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    /** 적립 매장. 매장 조건형 · 단계 교환형에서 필요하다(F10 매장 반영). */
    storeId: uuid("store_id").references(() => stores.id),
    storeNameRaw: text("store_name_raw"),
    appliedVia: text("applied_via", { enum: APPLIED_VIA }),
    /** 단계 교환형에서 교환한 단계(D11 확장). 매머드커피 12 또는 20. */
    tierThreshold: integer("tier_threshold"),
    note: text("note"),
    /** D19 요청 중복 방지의 최소 부분집합 */
    requestId: text("request_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("uq_stamp_events_id_user").on(t.id, t.userId),
    foreignKey({
      columns: [t.stampBalanceId, t.userId],
      foreignColumns: [stampBalances.id, stampBalances.userId],
      name: "fk_stamp_events_balance",
    }).onDelete("cascade"),
    // 06 §10.1: 같은 계정의 같은 요청ID는 같은 결과로 이어진다.
    uniqueIndex("uq_stamp_events_request")
      .on(t.userId, t.requestId)
      .where(sql`${t.requestId} is not null`),
    // 한 잔액의 최초 등록은 하나뿐이다.
    uniqueIndex("uq_stamp_events_initial_import")
      .on(t.stampBalanceId)
      .where(sql`${t.eventType} = 'initial_import' and ${t.deletedAt} is null`),
    index("ix_stamp_events_balance_time").on(t.stampBalanceId, t.occurredAt),
    index("ix_stamp_events_user_time").on(t.userId, t.occurredAt),
    index("ix_stamp_events_recorded").on(t.recordedAt),
    check("chk_stamp_events_event_type", inList(t.eventType, STAMP_EVENT_TYPE)),
    check("chk_stamp_events_applied_via", inList(t.appliedVia, APPLIED_VIA)),
    check(
      "chk_stamp_events_quantity_before",
      sql`${t.quantityBefore} is null or ${t.quantityBefore} between 0 and ${n(QTY_MAX)}`,
    ),
    check(
      "chk_stamp_events_quantity_after",
      sql`${t.quantityAfter} is null or ${t.quantityAfter} between 0 and ${n(QTY_MAX)}`,
    ),
    check(
      "chk_stamp_events_store_identity",
      sql`num_nonnulls(${t.storeId}, ${t.storeNameRaw}) <= 1`,
    ),
    check(
      "chk_stamp_events_note_len",
      sql`${t.note} is null or char_length(${t.note}) <= ${n(TEXT_LONG_MAX)}`,
    ),
    check(
      "chk_stamp_events_store_name_len",
      sql`${t.storeNameRaw} is null or char_length(${t.storeNameRaw}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/* ───────────────────────── 쿠폰 (D09 · D10 보존) ───────────────────────── */

/**
 * D09 개별 쿠폰.
 *
 * CupPick은 공식 쿠폰을 발급하지 않는다(POL01.1 · POL26.4). 여기 있는 값은
 * 사용자가 공식 앱에서 확인한 상태의 기록이다. 그래서 issued_at · expires_on이
 * 모두 nullable이고, 사용 완료도 사용자가 직접 기록한다(POL13.4).
 *
 * 화면의 6종 표시 상태는 저장하지 않는다. lifecycle · date_trust · usable_from과
 * 실행 시점의 한국 시각에서 계산한다(POL09.6 · POL13.5 · 06 §6).
 *
 * 중복 방지 유니크 제약을 걸지 않는다 — POL13.2는 "중복 의심 안내"만 요구하고
 * F17은 복수 발급을 정상 동작으로 허용한다.
 */
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    brandProgramId: text("brand_program_id").references(() => brandPrograms.id),
    name: text("name").notNull(),
    couponKind: text("coupon_kind", { enum: COUPON_KIND }).notNull(),
    lifecycle: text("lifecycle", { enum: COUPON_LIFECYCLE }).notNull().default("held"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    usableFrom: timestamp("usable_from", { withTimezone: true }),
    usableFromPrecision: text("usable_from_precision", { enum: USABLE_FROM_PRECISION }),
    /** 한국 달력 날짜. mode:"string"으로 다뤄 시간대 혼동을 없앤다(05 §4.1). */
    expiresOn: date("expires_on", { mode: "string" }),
    dateTrust: text("date_trust", { enum: DATE_TRUST }).notNull().default("unknown"),
    usedAt: timestamp("used_at", { withTimezone: true }),
    conditionNote: text("condition_note"),
    /**
     * 전환 연결(D09 확장). 복수 쿠폰 전환은 여러 쿠폰이 같은 사건을 가리킨다.
     *
     * FK를 여기 선언하지 않는다. 최종 형태는
     *   (source_stamp_event_id, user_id) -> stamp_events(id, user_id)
     *   ON DELETE SET NULL (source_stamp_event_id)
     * 인데 Drizzle이 SET NULL의 컬럼 목록 지정을 표현하지 못한다.
     * 0001 custom migration에서 만든다(하단 주석 2번).
     */
    sourceStampEventId: uuid("source_stamp_event_id"),
    version: integer("version").notNull().default(1),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("uq_coupons_id_user").on(t.id, t.userId),
    index("ix_coupons_user_lifecycle")
      .on(t.userId, t.lifecycle)
      .where(sql`${t.deletedAt} is null`),
    // 만료임박 정렬(POL05.2)과 D-3/당일 알림 스캔(POL16.1)
    index("ix_coupons_user_expiry")
      .on(t.userId, t.expiresOn)
      .where(sql`${t.deletedAt} is null and ${t.lifecycle} = 'held'`),
    index("ix_coupons_source_event").on(t.sourceStampEventId),
    index("ix_coupons_deleted")
      .on(t.deletedAt)
      .where(sql`${t.deletedAt} is not null`),

    check("chk_coupons_coupon_kind", inList(t.couponKind, COUPON_KIND)),
    check("chk_coupons_lifecycle", inList(t.lifecycle, COUPON_LIFECYCLE)),
    check("chk_coupons_date_trust_value", inList(t.dateTrust, DATE_TRUST)),
    check(
      "chk_coupons_usable_from_precision",
      inList(t.usableFromPrecision, USABLE_FROM_PRECISION),
    ),
    check("chk_coupons_name_len", sql`char_length(${t.name}) between 1 and ${n(TEXT_SHORT_MAX)}`),
    check(
      "chk_coupons_condition_note_len",
      sql`${t.conditionNote} is null or char_length(${t.conditionNote}) <= ${n(TEXT_LONG_MAX)}`,
    ),
    // POL09.1: 확인/예상은 날짜값이 있고 미확인/무기한은 없다.
    check(
      "chk_coupons_date_trust",
      sql`(${t.dateTrust} in ('confirmed', 'estimated')) = (${t.expiresOn} is not null)`,
    ),
    check(
      "chk_coupons_usable_precision",
      sql`(${t.usableFrom} is null) = (${t.usableFromPrecision} is null)`,
    ),
    check("chk_coupons_used_at", sql`(${t.lifecycle} = 'used') = (${t.usedAt} is not null)`),
    // POL09.4 시작일 > 만료일은 오류.
    // timezone(text, timestamptz)가 IMMUTABLE이라 CHECK에서 쓸 수 있다.
    check(
      "chk_coupons_usable_before_expiry",
      sql`${t.usableFrom} is null or ${t.expiresOn} is null or (${t.usableFrom} at time zone 'Asia/Seoul')::date <= ${t.expiresOn}`,
    ),
  ],
);

/**
 * D10 보존 스냅샷(부모). 매장 조건형 쿠폰을 기록한 시점의 매장 상태를 고정한다.
 *
 * 이 행의 존재 여부가 POL14.6의 세 상태를 가른다.
 * - 행이 없음        → 그 쿠폰의 매장 조건은 전체 미확인
 * - 행은 있고 항목 없음 → 그 매장은 "불가"가 아니라 미확인
 * - 항목이 있음      → 보존 수량과 필요 수량으로 판정
 *
 * updated_at · version이 없는 것은 의도다. 스냅샷은 불변이며 UPDATE 경로가 없다
 * (POL14.5 · 06 §5.10 "이후 적립으로 갱신하지 않는다").
 */
export const couponStoreSnapshots = pgTable(
  "coupon_store_snapshots",
  {
    couponId: uuid("coupon_id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    /** 어느 잔액에서 떴는지에 대한 근거. 잔액이 사라져도 스냅샷은 남는다. */
    sourceStampBalanceId: uuid("source_stamp_balance_id").references(() => stampBalances.id, {
      onDelete: "set null",
    }),
    listCompleteness: text("list_completeness", { enum: LIST_COMPLETENESS })
      .notNull()
      .default("partial"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.couponId, t.userId],
      foreignColumns: [coupons.id, coupons.userId],
      name: "fk_coupon_store_snapshots_coupon",
    }).onDelete("cascade"),
    check("chk_coupon_store_snapshots_completeness", inList(t.listCompleteness, LIST_COMPLETENESS)),
  ],
);

/**
 * D10 보존 스냅샷 자식행.
 *
 * required_quantity를 brand_programs.min_store_count에서 조인해 읽지 않고 복사한다.
 * POL26의 값이 나중에 바뀌어도 이미 기록한 쿠폰의 판정은 변하면 안 되기 때문이다
 * (POL14.5). 06 §3 D10도 필요 수량을 항목별로 남기라고 규정한다.
 */
export const couponStoreSnapshotEntries = pgTable(
  "coupon_store_snapshot_entries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => couponStoreSnapshots.couponId, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id),
    storeNameRaw: text("store_name_raw"),
    /** 기록 시점 그 매장의 적립 수량 */
    preservedQuantity: integer("preserved_quantity").notNull(),
    /** 기록 시점 그 매장에 필요했던 최소 적립 수 */
    requiredQuantity: integer("required_quantity").notNull(),
  },
  (t) => [
    uniqueIndex("uq_coupon_snapshot_entries_store_id")
      .on(t.couponId, t.storeId)
      .where(sql`${t.storeId} is not null`),
    uniqueIndex("uq_coupon_snapshot_entries_store_name")
      .on(t.couponId, t.storeNameRaw)
      .where(sql`${t.storeNameRaw} is not null`),
    check(
      "chk_coupon_snapshot_entries_preserved",
      sql`${t.preservedQuantity} between 0 and ${n(QTY_MAX)}`,
    ),
    check("chk_coupon_snapshot_entries_required", sql`${t.requiredQuantity} >= 1`),
    check(
      "chk_coupon_snapshot_entries_store_identity",
      sql`num_nonnulls(${t.storeId}, ${t.storeNameRaw}) = 1`,
    ),
    check(
      "chk_coupon_snapshot_entries_store_name_len",
      sql`${t.storeNameRaw} is null or char_length(${t.storeNameRaw}) between 1 and ${n(TEXT_SHORT_MAX)}`,
    ),
  ],
);

/* ──────────────────── Drizzle로 표현하지 못한 제약 ──────────────────── */
/**
 * 아래 1·2는 Drizzle DSL이 표현하지 못해 0001 custom migration에서 만든다.
 * 자동 생성 migration은 손으로 고치지 않는다.
 *
 * 1. saved_places.uq_saved_places_user_slot 을 DEFERRABLE INITIALLY IMMEDIATE 로 교체.
 *    Drizzle은 DEFERRABLE을 트랜잭션 설정에만 지원하고 제약에는 지원하지 않는다.
 *    즉시 검사만 가능하면 순서 재배열(1↔2 교환)이 실패한다. INITIALLY IMMEDIATE이므로
 *    평소에는 즉시 검사되고, 재배열 트랜잭션만 SET CONSTRAINTS ... DEFERRED로 미룬다.
 *
 * 2. coupons (source_stamp_event_id, user_id) -> stamp_events (id, user_id) 복합 FK.
 *    ON DELETE SET NULL (source_stamp_event_id) 로 source만 비우고 user_id는 지킨다.
 *    참조 대상 유니크는 stamp_events.uq_stamp_events_id_user 가 이미 만족한다.
 *
 * 3. 다중 행 · 타 테이블 참조라 CHECK으로 표현할 수 없는 규칙(application 담당)
 *    - 매장별 적립 수량 합계 = stamp_balances.current_quantity (POL06.5)
 *    - per_store_separated 프로그램은 store 지정 필수,
 *      store_conditional 프로그램은 store 없이 자식행 사용 (POL26)
 *    - 매장 조건형 · 단계 교환형의 적립 매장 필수 (F10)
 *    - brand_program_tiers의 step_no 순서와 threshold 오름차순 일치
 *    - 확인 시각이 미래가 아님 (05 §4.1)
 *    - 요청 본문의 계정ID가 아니라 인증 계정으로 소유권 판정 (05 §4.1)
 */
