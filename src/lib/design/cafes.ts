/**
 * 조회 위치와 매장 표본.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 CAFES · LOCS · PRESETS.
 *
 * 실제 경로는 아직 없다. 조회 위치·저장한 장소는 F02, 주변 매장·도보 시간은
 * F03이며, 해당 기능을 붙일 때 이 모듈을 그 조회 결과로 교체한다.
 */
import type { ProgramKey } from "./brands.ts";

export type LocationKey = "hwajeong" | "haengsin" | "wondang" | "samsong";

export type Cafe = {
  id: string;
  brandId: string;
  program: ProgramKey | null;
  name: string;
  /** 지도 placeholder 안의 상대 좌표. 실제 좌표가 아니다. */
  x: string;
  y: string;
  walkMinutes: Record<LocationKey, number>;
};

export const CAFES: Cafe[] = [
  { id: "p1", brandId: "paik", program: null, name: "빽다방 화정역점", x: "22%", y: "58%", walkMinutes: { hwajeong: 3, haengsin: 15, wondang: 17, samsong: 21 } },
  { id: "p2", brandId: "paik", program: null, name: "빽다방 화정로데오점", x: "22%", y: "34%", walkMinutes: { hwajeong: 7, haengsin: 18, wondang: 16, samsong: 23 } },
  { id: "p3", brandId: "paik", program: null, name: "빽다방 행신역점", x: "88%", y: "34%", walkMinutes: { hwajeong: 16, haengsin: 4, wondang: 24, samsong: 26 } },
  { id: "m1", brandId: "mega", program: null, name: "메가MGC커피 화정역점", x: "30%", y: "46%", walkMinutes: { hwajeong: 4, haengsin: 13, wondang: 16, samsong: 19 } },
  { id: "m2", brandId: "mega", program: null, name: "메가MGC커피 덕양구청점", x: "62%", y: "44%", walkMinutes: { hwajeong: 9, haengsin: 17, wondang: 12, samsong: 16 } },
  { id: "m3", brandId: "mega", program: null, name: "메가MGC커피 원당역점", x: "14%", y: "72%", walkMinutes: { hwajeong: 18, haengsin: 22, wondang: 4, samsong: 12 } },
  { id: "v1", brandId: "venti", program: null, name: "더벤티 화정역점", x: "40%", y: "66%", walkMinutes: { hwajeong: 6, haengsin: 16, wondang: 15, samsong: 20 } },
  { id: "v2", brandId: "venti", program: null, name: "더벤티 화정중앙점", x: "62%", y: "68%", walkMinutes: { hwajeong: 10, haengsin: 19, wondang: 14, samsong: 22 } },
  { id: "c1s", brandId: "compose", program: null, name: "컴포즈커피 덕양구청점", x: "86%", y: "60%", walkMinutes: { hwajeong: 8, haengsin: 18, wondang: 11, samsong: 15 } },
  { id: "c2s", brandId: "compose", program: null, name: "컴포즈커피 화정역점", x: "44%", y: "28%", walkMinutes: { hwajeong: 5, haengsin: 14, wondang: 18, samsong: 21 } },
  { id: "c3s", brandId: "compose", program: null, name: "컴포즈커피 삼송역점", x: "44%", y: "14%", walkMinutes: { hwajeong: 24, haengsin: 26, wondang: 13, samsong: 6 } },
  { id: "d1", brandId: "mammoth", program: "coffee", name: "매머드커피 화정로데오점", x: "22%", y: "14%", walkMinutes: { hwajeong: 12, haengsin: 20, wondang: 19, samsong: 24 } },
  { id: "d2", brandId: "mammoth", program: "coffee", name: "매머드커피 행신역점", x: "88%", y: "44%", walkMinutes: { hwajeong: 17, haengsin: 6, wondang: 25, samsong: 27 } },
  { id: "d3", brandId: "mammoth", program: "express", name: "매머드익스프레스 화정역점", x: "34%", y: "22%", walkMinutes: { hwajeong: 5, haengsin: 16, wondang: 18, samsong: 22 } },
  { id: "u1", brandId: "uzi", program: null, name: "우지커피 행신역점", x: "88%", y: "72%", walkMinutes: { hwajeong: 14, haengsin: 4, wondang: 22, samsong: 17 } },
  { id: "u2", brandId: "uzi", program: null, name: "우지커피 화정역점", x: "52%", y: "52%", walkMinutes: { hwajeong: 7, haengsin: 17, wondang: 16, samsong: 22 } },
  { id: "u3", brandId: "uzi", program: null, name: "우지커피 원당역점", x: "14%", y: "86%", walkMinutes: { hwajeong: 19, haengsin: 23, wondang: 6, samsong: 13 } },
  { id: "t1", brandId: "tenpercent", program: null, name: "텐퍼센트커피 원당역점", x: "36%", y: "80%", walkMinutes: { hwajeong: 20, haengsin: 24, wondang: 5, samsong: 9 } },
  { id: "t2", brandId: "tenpercent", program: null, name: "텐퍼센트커피 삼송역점", x: "60%", y: "14%", walkMinutes: { hwajeong: 25, haengsin: 27, wondang: 14, samsong: 7 } },
  { id: "t3", brandId: "tenpercent", program: null, name: "텐퍼센트커피 화정역점", x: "40%", y: "40%", walkMinutes: { hwajeong: 6, haengsin: 15, wondang: 17, samsong: 21 } },
];

export const QUERY_LOCATIONS: Record<LocationKey, { key: LocationKey; name: string; aliases: string[] }> = {
  hwajeong: { key: "hwajeong", name: "화정역", aliases: ["화정", "화정역", "화정동", "덕양구 화정동", "고양시 화정"] },
  haengsin: { key: "haengsin", name: "행신역", aliases: ["행신", "행신역", "행신동"] },
  wondang: { key: "wondang", name: "원당역", aliases: ["원당", "원당역", "원당동", "주교동"] },
  samsong: { key: "samsong", name: "삼송역", aliases: ["삼송", "삼송역", "삼송동", "원흥"] },
};

/** 복원 위치가 없을 때의 기본 조회 위치. */
export const DEFAULT_LOCATION: LocationKey = "hwajeong";

/**
 * 디자인의 '자주 가는 곳' 표본. 실제로는 계정에 속한 저장한 장소이며
 * 비로그인에는 제공하지 않는다(05-policy.md POL02.1 · 04-features.md F02).
 */
export const SAVED_PLACES: { id: string; label: string; location: LocationKey }[] = [
  { id: "home", label: "집", location: "haengsin" },
  { id: "work", label: "회사", location: "wondang" },
  { id: "samsong", label: "삼송", location: "samsong" },
];

/** 도보 15분 기본, 30분이 MVP 최대다(F03). */
export const WALK_RANGES = [15, 30] as const;

export type WalkRange = (typeof WALK_RANGES)[number];

/** 지역명 입력을 조회 위치로 맞춘다. 외부 검색 API를 쓰지 않는다. */
export function matchLocation(query: string): LocationKey | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const keys = Object.keys(QUERY_LOCATIONS) as LocationKey[];
  return (
    keys.find((key) =>
      QUERY_LOCATIONS[key].aliases.some(
        (alias) => alias.includes(trimmed) || trimmed.includes(alias),
      ),
    ) ?? null
  );
}

/** 브랜드 이름을 뗀 지점명. "빽다방 화정역점" → "화정역점". */
export function storeLabel(cafe: Cafe, brandName: string, programName: string): string {
  return cafe.name.replace(`${programName} `, "").replace(`${brandName} `, "");
}
