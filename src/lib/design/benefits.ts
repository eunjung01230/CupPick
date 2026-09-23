/**
 * 내 혜택(스탬프 잔액 · 쿠폰) 표본과 그 타입.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 seed().
 *
 * 개인 혜택 데이터는 아직 DB 경로가 없다(F08~F20 미구현). 이 표본은 화면을
 * 확인하기 위한 mock이며, 실제 저장 경로가 생기면 그대로 교체한다.
 * 만료일은 저장된 고정 날짜가 아니라 실행 시점 기준으로 만든다(04 §0.7).
 */
import type { ProgramKey } from "./brands.ts";
import { isoFromToday, monthDayFromToday } from "./dates.ts";
import type { TrustLevel } from "./tokens.ts";

/** 만료일이 같은 스탬프 묶음(D08). */
export type Bundle = { n: number; date: string | null; trust: TrustLevel };

/** 적립 범위. 공통인지 매장 전용인지 모르면 미확인이다(POL14). */
export type StampScope = "공통 적립" | "매장 적립" | "적립 범위 미확인";

export type Balance = {
  id: string;
  brandId: string;
  programKey: ProgramKey | null;
  /** 매장 전용 잔액의 매장명. 공통이면 null. */
  store: string | null;
  programLabel: string;
  purpose: string;
  scope: StampScope;
  qty: number;
  /** 공식 앱에서 확인한 수량과 그 시점 */
  official: number;
  officialAt: string;
  /** 구성 확인 필요(F11) */
  composition: boolean;
  /** 전환 확인 필요 수량(F16) */
  conversion: number;
  bundles: Bundle[];
  /** 매장 조건형의 매장별 적립 수량(R68) */
  storeStamps: [string, number][] | null;
  history: [string, string][];
};

/** 쿠폰 사용 범위. listed는 일부 목록만 확인된 상태다(POL15). */
export type CouponScope = "common" | "store" | "listed" | "conflict" | "unknown";

export type Coupon = {
  id: string;
  brandId: string;
  programKey: ProgramKey | null;
  name: string;
  kind: string;
  /** 만료일 */
  date: string | null;
  issued: string | null;
  /** 이 날짜부터 사용 가능(빽다방 등) */
  usableFrom: string | null;
  /** n분 후 사용 가능 */
  usableMin: number;
  trust: TrustLevel;
  life: "held" | "used";
  scope: CouponScope;
  /** 기록 시점의 매장별 적립 스냅샷(R69). 이후 적립과 무관하다. */
  stores: [string, number][] | null;
};

export type BenefitData = { balances: Balance[]; coupons: Coupon[] };

/** 디자인 표본을 오늘 기준으로 만든다. */
export function seedBenefits(): BenefitData {
  return {
    balances: [
      { id: "b1", brandId: "compose", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "공통 적립", qty: 5, official: 5, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 5, date: isoFromToday(196), trust: "confirmed" }], storeStamps: null,
        history: [[monthDayFromToday(-1), "덕양구청점"], [monthDayFromToday(-5), "화정역점"], [monthDayFromToday(-9), "덕양구청점"], [monthDayFromToday(-13), "덕양구청점"], [monthDayFromToday(-18), "화정역점"]] },
      { id: "b2", brandId: "mega", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "공통 적립", qty: 8, official: 8, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 8, date: isoFromToday(138), trust: "confirmed" }], storeStamps: null,
        history: [[monthDayFromToday(0), "화정역점"], [monthDayFromToday(-2), "화정역점"], [monthDayFromToday(-6), "덕양구청점"], [monthDayFromToday(-10), "화정역점"]] },
      { id: "b3", brandId: "paik", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "공통 적립", qty: 7, official: 7, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 7, date: isoFromToday(160), trust: "confirmed" }], storeStamps: null,
        history: [[monthDayFromToday(0), "화정역점"], [monthDayFromToday(-3), "화정역점"], [monthDayFromToday(-7), "화정로데오점"], [monthDayFromToday(-11), "화정역점"]] },
      { id: "b4", brandId: "venti", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "공통 적립", qty: 6, official: 6, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 6, date: isoFromToday(138), trust: "confirmed" }], storeStamps: null,
        history: [[monthDayFromToday(-2), "화정역점"], [monthDayFromToday(-6), "화정중앙점"], [monthDayFromToday(-12), "화정역점"]] },
      { id: "b5", brandId: "mammoth", programKey: "express", store: null, programLabel: "매머드익스프레스", purpose: "교환용", scope: "공통 적립", qty: 7, official: 7, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 7, date: isoFromToday(288), trust: "estimated" }], storeStamps: null,
        history: [[monthDayFromToday(-3), "화정역점"], [monthDayFromToday(-8), "화정역점"], [monthDayFromToday(-14), "화정역점"]] },
      { id: "b6", brandId: "mammoth", programKey: "coffee", store: "행신역점", programLabel: "매머드커피", purpose: "교환용", scope: "매장 적립", qty: 12, official: 12, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 12, date: isoFromToday(288), trust: "estimated" }], storeStamps: null,
        history: [[monthDayFromToday(-1), "행신역점"], [monthDayFromToday(-4), "행신역점"], [monthDayFromToday(-9), "행신역점"]] },
      { id: "b9", brandId: "mammoth", programKey: "coffee", store: "화정로데오점", programLabel: "매머드커피", purpose: "교환용", scope: "매장 적립", qty: 5, official: 5, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 5, date: isoFromToday(288), trust: "estimated" }], storeStamps: null,
        history: [[monthDayFromToday(-5), "화정로데오점"], [monthDayFromToday(-11), "화정로데오점"]] },
      { id: "b7", brandId: "tenpercent", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "매장 적립", qty: 8, official: 8, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 8, date: isoFromToday(166), trust: "confirmed" }],
        storeStamps: [["원당역점", 4], ["삼송역점", 3], ["화정역점", 1]],
        history: [[monthDayFromToday(0), "원당역점"], [monthDayFromToday(-2), "삼송역점"], [monthDayFromToday(-5), "원당역점"], [monthDayFromToday(-8), "화정역점"]] },
      { id: "b8", brandId: "uzi", programKey: null, store: null, programLabel: "기본 적립", purpose: "교환용", scope: "매장 적립", qty: 7, official: 7, officialAt: "방금", composition: false, conversion: 0,
        bundles: [{ n: 7, date: isoFromToday(196), trust: "estimated" }],
        storeStamps: [["행신역점", 4], ["화정역점", 2], ["원당역점", 1]],
        history: [[monthDayFromToday(-1), "행신역점"], [monthDayFromToday(-4), "행신역점"], [monthDayFromToday(-7), "화정역점"]] },
    ],
    coupons: [
      { id: "k1", brandId: "compose", programKey: null, name: "아메리카노 리워드", kind: "스탬프 쿠폰", date: isoFromToday(18), issued: isoFromToday(-12), usableFrom: null, usableMin: 0, trust: "confirmed", life: "held", scope: "common", stores: null },
      { id: "k2", brandId: "mega", programKey: null, name: "2,000원 리워드", kind: "스탬프 쿠폰", date: isoFromToday(23), issued: isoFromToday(0), usableFrom: null, usableMin: 5, trust: "confirmed", life: "held", scope: "common", stores: null },
      { id: "k3", brandId: "paik", programKey: null, name: "아메리카노 무료 쿠폰", kind: "스탬프 쿠폰", date: isoFromToday(28), issued: isoFromToday(0), usableFrom: isoFromToday(1), usableMin: 0, trust: "confirmed", life: "held", scope: "common", stores: null },
      { id: "k4", brandId: "tenpercent", programKey: null, name: "2,000원 쿠폰", kind: "스탬프 쿠폰", date: isoFromToday(12), issued: isoFromToday(-14), usableFrom: null, usableMin: 0, trust: "confirmed", life: "held", scope: "store",
        stores: [["원당역점", 4], ["삼송역점", 3], ["화정역점", 2]] },
      { id: "k5", brandId: "uzi", programKey: null, name: "아메리카노 무료 쿠폰", kind: "스탬프 쿠폰", date: isoFromToday(8), issued: isoFromToday(-16), usableFrom: null, usableMin: 0, trust: "confirmed", life: "held", scope: "store",
        stores: [["행신역점", 4], ["화정역점", 2], ["원당역점", 1]] },
    ],
  };
}
