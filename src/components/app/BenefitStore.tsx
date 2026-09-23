"use client";

/**
 * 내 혜택 mock 저장소.
 *
 * 개인 혜택의 실제 저장 경로(F08~F20)는 아직 없다. 디자인 흐름을 화면에서
 * 확인할 수 있도록 표본 데이터를 메모리에만 두고, 디자인이 정의한 기록 동작을
 * 그대로 재현한다. 새로 고치면 표본으로 돌아간다.
 *
 * 동작 규칙은 docs/design/cuppick -v2/CupPick v2.dc.html 의 recordCoupon ·
 * applyUpdate · applyConvert · saveDirect 를 따른다. CupPick은 공식 쿠폰을
 * 발급하거나 공식 스탬프를 차감하지 않고, 사용자가 공식 앱에서 한 일을 기록만 한다.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { BRAND_META, programGoal, type ProgramKey } from "@/lib/design/brands.ts";
import {
  seedBenefits,
  type Balance,
  type BenefitData,
  type Coupon,
  type CouponScope,
} from "@/lib/design/benefits.ts";
import { isoFromToday } from "@/lib/design/dates.ts";
import type { TrustLevel } from "@/lib/design/tokens.ts";

/** 기록 갱신 방식(F10). */
export type UpdateMode = "add" | "set" | "same" | "comp";

/** 직접 등록 입력(F08 · F19). */
export type DirectDraft = {
  brandId: string;
  programKey: ProgramKey | null;
  kind: "stamp" | "coupon";
  name: string;
  qty: number;
  stores: Record<string, number>;
  trust: TrustLevel;
  scope: "common" | "unknown";
};

type BenefitStoreValue = {
  data: BenefitData;
  toast: string | null;
  showToast: (message: string) => void;
  dismissToast: () => void;
  recordIssuedCoupon: (balanceId: string, amount: number, couponName: string) => void;
  applyUpdate: (balanceId: string, mode: UpdateMode, input: number) => string;
  applyConvert: (balanceId: string, issued: "yes" | "already" | "no") => string;
  saveDirect: (draft: DirectDraft) => { brandId: string; message: string };
  setCouponLife: (couponId: string, life: Coupon["life"]) => void;
  resolveComposition: (balanceId: string) => void;
  resolveConversion: (balanceId: string, issued: boolean) => void;
};

const BenefitStoreContext = createContext<BenefitStoreValue | null>(null);

export function BenefitStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BenefitData>(() => seedBenefits());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => setToast(message), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const recordIssuedCoupon = useCallback((balanceId: string, amount: number, couponName: string) => {
    setData((current) => {
      const balance = current.balances.find((b) => b.id === balanceId);
      if (!balance) return current;

      const isStoreType = BRAND_META[balance.brandId]?.type === "store";
      // 매장 조건형 쿠폰의 사용 가능 매장은 기록 시점 상태로 고정한다(R69).
      const snapshot = isStoreType && balance.storeStamps ? balance.storeStamps.map(([n, q]) => [n, q] as [string, number]) : null;
      const left = balance.qty - amount;

      return {
        balances: current.balances.map((b) =>
          b.id === balanceId
            ? { ...b, qty: left, official: left, officialAt: "방금", storeStamps: null, bundles: [{ n: left, date: null, trust: "unknown" as TrustLevel }] }
            : b,
        ),
        coupons: current.coupons.concat([
          {
            id: `x${Date.now()}`,
            brandId: balance.brandId,
            programKey: balance.programKey,
            name: couponName,
            kind: "스탬프 쿠폰",
            date: null,
            issued: isoFromToday(0),
            usableFrom: null,
            usableMin: 0,
            trust: "unknown",
            life: "held",
            scope: (isStoreType ? "store" : "common") as CouponScope,
            stores: snapshot,
          },
        ]),
      };
    });
    setToast("공식 앱에서 받은 쿠폰을 기록했습니다. 만료일은 상세에서 입력할 수 있어요.");
  }, []);

  const applyUpdate = useCallback((balanceId: string, mode: UpdateMode, input: number) => {
    let message = "";

    setData((current) => ({
      ...current,
      balances: current.balances.map((balance) => {
        if (balance.id !== balanceId) return balance;

        if (mode === "add") {
          message = `적립분 ${input}개를 추가했습니다. 전체 공식 확인 시점은 갱신하지 않았습니다.`;
          return {
            ...balance,
            qty: balance.qty + input,
            bundles: balance.bundles.concat([{ n: input, date: isoFromToday(365), trust: "estimated" }]),
          };
        }
        if (mode === "set") {
          message = `현재 잔액을 ${input}개로 맞췄습니다. 이미 반영된 만료·전환을 다시 차감하지 않았습니다.`;
          return { ...balance, qty: input, official: input, officialAt: "방금" };
        }
        if (mode === "same") {
          message = `잔액 ${balance.qty}개를 유지하고 공식 확인 수량 ${balance.qty}개와 확인 시점만 기록했습니다.`;
          return { ...balance, official: balance.qty, officialAt: "방금" };
        }
        message = `잔액 ${balance.qty}개를 유지하고 영향 가능한 기존 묶음 전체를 보류했습니다.`;
        return { ...balance, composition: true };
      }),
    }));

    setToast(message);
    return message;
  }, []);

  const applyConvert = useCallback((balanceId: string, issued: "yes" | "already" | "no") => {
    let message = "";

    setData((current) => {
      const balance = current.balances.find((b) => b.id === balanceId);
      if (!balance) return current;

      if (issued === "no") {
        message = "쿠폰을 만들지 않고 잔액도 유지했습니다. 해당 수량의 만료 자동 차감·알림을 보류합니다.";
        return {
          ...current,
          balances: current.balances.map((b) => (b.id === balanceId ? { ...b, conversion: b.qty } : b)),
        };
      }

      // 쿠폰 기록과 잔액 조정은 함께 반영한다(POL11). 이미 맞춘 잔액은 다시 차감하지 않는다.
      const deduct = issued === "yes" ? Math.min(programGoal(balance.brandId, balance.programKey), balance.qty) : 0;
      message = deduct
        ? `쿠폰 기록과 스탬프 ${deduct}개 차감을 함께 저장했습니다. 재시도해도 한 번만 반영됩니다.`
        : "연결 기록만 남겼습니다. 이미 맞춘 잔액에 추가 차감하지 않았습니다.";

      return {
        balances: current.balances.map((b) =>
          b.id === balanceId
            ? { ...b, qty: b.qty - deduct, official: b.qty - deduct, officialAt: "방금", bundles: deduct ? [] : b.bundles }
            : b,
        ),
        coupons: current.coupons.concat([
          {
            id: `cv${Date.now()}`,
            brandId: balance.brandId,
            programKey: balance.programKey,
            name: "스탬프 교환 쿠폰",
            kind: "스탬프 쿠폰",
            date: null,
            issued: isoFromToday(0),
            usableFrom: null,
            usableMin: 0,
            trust: "unknown",
            life: "held",
            scope: "unknown",
            stores: null,
          },
        ]),
      };
    });

    setToast(message);
    return message;
  }, []);

  const saveDirect = useCallback((draft: DirectDraft) => {
    let message = "";
    const storeStamps = Object.entries(draft.stores).filter(([, n]) => n > 0) as [string, number][];

    setData((current) => {
      if (draft.kind === "stamp") {
        const existing = current.balances.find(
          (b) => b.brandId === draft.brandId && b.programKey === draft.programKey,
        );

        if (existing) {
          message = "기존 기록을 수정했습니다.";
          return {
            ...current,
            balances: current.balances.map((b) =>
              b.id === existing.id
                ? {
                    ...b,
                    qty: draft.qty,
                    official: draft.qty,
                    officialAt: "방금",
                    storeStamps: storeStamps.length ? storeStamps : b.storeStamps,
                    bundles: [{ n: draft.qty, date: null, trust: "unknown" as TrustLevel }],
                    composition: false,
                  }
                : b,
            ),
          };
        }

        // 매머드커피는 매장 간 합산이 금지라 매장별로 따로 저장한다(POL26.3).
        if (draft.brandId === "mammoth" && draft.programKey === "coffee" && storeStamps.length) {
          message = "매머드커피 스탬프를 매장별로 저장했습니다.";
          const created: Balance[] = storeStamps.map(([store, qty], index) => ({
            id: `n${Date.now()}${index}`,
            brandId: "mammoth",
            programKey: "coffee",
            store,
            programLabel: "매머드커피",
            purpose: "교환용",
            scope: "매장 적립",
            qty,
            official: qty,
            officialAt: "방금",
            composition: false,
            conversion: 0,
            storeStamps: null,
            history: [],
            bundles: [{ n: qty, date: null, trust: "unknown" }],
          }));
          return { ...current, balances: current.balances.concat(created) };
        }

        message = `스탬프 ${draft.qty}개로 저장했습니다.`;
        const needsStore = BRAND_META[draft.brandId]?.type === "store";
        return {
          ...current,
          balances: current.balances.concat([
            {
              id: `n${Date.now()}`,
              brandId: draft.brandId,
              programKey: draft.programKey,
              store: null,
              programLabel: "기본 적립",
              purpose: "교환용",
              scope: needsStore ? "매장 적립" : "공통 적립",
              qty: draft.qty,
              official: draft.qty,
              officialAt: "방금",
              composition: false,
              conversion: 0,
              storeStamps: storeStamps.length ? storeStamps : null,
              history: [],
              bundles: [{ n: draft.qty, date: null, trust: "unknown" }],
            },
          ]),
        };
      }

      message = "쿠폰을 등록했습니다.";
      // 등록일을 발급일로 간주하지 않는다(POL13). 만료일은 선택한 신뢰 수준에 따른다.
      const date = draft.trust === "confirmed" ? isoFromToday(7) : draft.trust === "estimated" ? isoFromToday(30) : null;
      return {
        ...current,
        coupons: current.coupons.concat([
          {
            id: `u${Date.now()}`,
            brandId: draft.brandId,
            programKey: draft.programKey,
            name: draft.name,
            kind: "행사·기타 쿠폰",
            date,
            issued: isoFromToday(0),
            usableFrom: null,
            usableMin: 0,
            trust: draft.trust,
            life: "held",
            scope: draft.scope === "common" ? "common" : BRAND_META[draft.brandId]?.type === "store" ? "store" : "common",
            stores: null,
          },
        ]),
      };
    });

    setToast(message);
    return { brandId: draft.brandId, message };
  }, []);

  const setCouponLife = useCallback((couponId: string, life: Coupon["life"]) => {
    setData((current) => ({
      ...current,
      coupons: current.coupons.map((coupon) => (coupon.id === couponId ? { ...coupon, life } : coupon)),
    }));
    setToast(life === "used" ? "사용 완료로 옮겼습니다." : "사용 취소했습니다.");
  }, []);

  const resolveComposition = useCallback((balanceId: string) => {
    setData((current) => ({
      ...current,
      balances: current.balances.map((balance) =>
        balance.id === balanceId
          ? { ...balance, composition: false, bundles: [{ n: balance.qty, date: null, trust: "unknown" as TrustLevel }] }
          : balance,
      ),
    }));
    setToast("만료 정보를 버리고 날짜 미확인 수량으로 정리했습니다. 잔액은 변하지 않았습니다.");
  }, []);

  const resolveConversion = useCallback((balanceId: string, issued: boolean) => {
    setData((current) => {
      const balance = current.balances.find((b) => b.id === balanceId);
      if (!balance) return current;

      if (!issued) {
        return {
          ...current,
          balances: current.balances.map((b) => (b.id === balanceId ? { ...b, conversion: 0 } : b)),
        };
      }

      return {
        balances: current.balances.map((b) =>
          b.id === balanceId ? { ...b, conversion: 0, qty: 0, official: 0, officialAt: "방금", bundles: [] } : b,
        ),
        coupons: current.coupons.concat([
          {
            id: `cv${Date.now()}`,
            brandId: balance.brandId,
            programKey: balance.programKey,
            name: "스탬프 교환 쿠폰",
            kind: "스탬프 쿠폰",
            date: null,
            issued: isoFromToday(0),
            usableFrom: null,
            usableMin: 0,
            trust: "unknown",
            life: "held",
            scope: "unknown",
            stores: null,
          },
        ]),
      };
    });
    setToast(
      issued
        ? "쿠폰 기록과 아직 반영되지 않은 차감만 함께 저장했습니다. 재시도해도 한 번만 반영됩니다."
        : "전환 보류를 해제하고 날짜·구성을 다시 평가했습니다. 추가 차감은 없습니다.",
    );
  }, []);

  const value = useMemo<BenefitStoreValue>(
    () => ({
      data,
      toast,
      showToast,
      dismissToast,
      recordIssuedCoupon,
      applyUpdate,
      applyConvert,
      saveDirect,
      setCouponLife,
      resolveComposition,
      resolveConversion,
    }),
    [
      data,
      toast,
      showToast,
      dismissToast,
      recordIssuedCoupon,
      applyUpdate,
      applyConvert,
      saveDirect,
      setCouponLife,
      resolveComposition,
      resolveConversion,
    ],
  );

  return <BenefitStoreContext.Provider value={value}>{children}</BenefitStoreContext.Provider>;
}

export function useBenefitStore(): BenefitStoreValue {
  const value = useContext(BenefitStoreContext);
  if (!value) throw new Error("BenefitStoreProvider 안에서만 쓸 수 있다");
  return value;
}
