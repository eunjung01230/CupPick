/**
 * 1차 지원 브랜드와 프로그램 유형.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 META · ORDER · PREF.
 * 값 원본은 05-policy.md POL26이며 04-features.md §0.1의 세 유형으로 갈린다.
 */

/** 04-features.md §0.1 브랜드 프로그램 유형. */
export type ProgramType =
  /** 누적형 — 기준 개수 도달 시 공식 앱에서 자동 발급 */
  | "cumulative"
  /** 매장 조건형 — 총 수량 + 매장별 수량으로 판정 */
  | "store"
  /** 단계 교환형 — 단계별로 사용자가 공식 앱에서 직접 교환 */
  | "tier";

/** 매머드처럼 한 브랜드 안에서 갈리는 프로그램. */
export type ProgramKey = "express" | "coffee";

export type ProgramMeta = {
  name: string;
  goal: number;
  type: ProgramType;
  tiers?: number[];
  perStore?: boolean;
};

export type BrandMeta = {
  name: string;
  /** 지도 핀·카드 아이콘의 한 글자 표기 */
  short: string;
  color: string;
  goal: number;
  type: ProgramType;
  /** 검색 화면이 보여주는 대표 매장 */
  store: string;
  /** 매장 조건형에서 쿠폰을 쓰기 위해 필요한 매장별 적립 수 */
  minStore?: number;
  /** 발급 다음 날부터 사용 가능한 브랜드(빽다방) */
  delay?: number;
  programs?: Record<ProgramKey, ProgramMeta>;
};

export const BRAND_META: Record<string, BrandMeta> = {
  compose: { name: "컴포즈커피", short: "컴", color: "#F5A623", goal: 10, type: "cumulative", store: "덕양구청점" },
  mega: { name: "메가MGC커피", short: "메", color: "#1B4D3E", goal: 10, type: "cumulative", store: "화정역점" },
  paik: { name: "빽다방", short: "빽", color: "#D0021B", goal: 10, type: "cumulative", delay: 1, store: "화정역점" },
  venti: { name: "더벤티", short: "벤", color: "#2C2C2C", goal: 10, type: "cumulative", store: "화정역점" },
  mammoth: {
    name: "매머드",
    short: "매",
    color: "#5B4A3E",
    goal: 10,
    type: "tier",
    store: "화정로데오점",
    programs: {
      express: { name: "매머드익스프레스", goal: 10, type: "cumulative" },
      coffee: { name: "매머드커피", goal: 20, type: "tier", tiers: [12, 20], perStore: true },
    },
  },
  uzi: { name: "우지커피", short: "우", color: "#6B4CE6", goal: 10, type: "store", minStore: 3, store: "행신역점" },
  tenpercent: { name: "텐퍼센트커피", short: "텐", color: "#0E7C66", goal: 10, type: "store", minStore: 3, store: "원당역점" },
};

/** 표시 순서(POL26 · 디자인 ORDER). */
export const BRAND_ORDER = [
  "compose",
  "mega",
  "paik",
  "venti",
  "mammoth",
  "uzi",
  "tenpercent",
] as const;

/** 선호 브랜드 정렬에 쓰는 표본(F07). 실제로는 계정 설정값이다. */
export const PREFERRED_BRANDS = ["paik", "mega", "compose", "venti"] as const;

/** 브랜드·프로그램에 해당하는 메타. 프로그램이 없으면 브랜드 메타다. */
export function programMeta(brandId: string, program: ProgramKey | null): ProgramMeta | BrandMeta {
  const brand = BRAND_META[brandId];
  if (program && brand?.programs) return brand.programs[program];
  return brand;
}

/** 화면에 쓰는 이름. 프로그램이 갈리면 프로그램 이름을 쓴다(POL26.3). */
export function programLabel(brandId: string, program: ProgramKey | null): string {
  return programMeta(brandId, program)?.name ?? brandId;
}

/** 교환 기준 개수. 단계 교환형은 마지막 단계다. */
export function programGoal(brandId: string, program: ProgramKey | null): number {
  const meta = programMeta(brandId, program);
  if (!meta) return 0;
  return "tiers" in meta && meta.tiers ? meta.tiers[meta.tiers.length - 1] : meta.goal;
}
