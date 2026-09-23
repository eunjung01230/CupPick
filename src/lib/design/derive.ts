/**
 * 화면이 쓰는 파생 값.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 timing · notices ·
 * storeRows · soonest · pendingList · cafeVerdict · cards · alerts.
 *
 * 순수 함수만 둔다. 상태를 바꾸는 동작은 화면 쪽 store가 맡는다.
 */
import {
  BRAND_META,
  BRAND_ORDER,
  PREFERRED_BRANDS,
  programGoal,
  programLabel,
  programMeta,
  type ProgramKey,
} from "./brands.ts";
import type { Balance, BenefitData, Coupon } from "./benefits.ts";
import type { Cafe } from "./cafes.ts";
import { daysUntil, shortDate } from "./dates.ts";
import { COLOR, TRUST, VERDICT, type VerdictLevel } from "./tokens.ts";

/** 매장 조건형 쿠폰의 매장별 사용 가능 여부. 기록 시점 스냅샷이다(R69). */
export function storeRows(coupon: Coupon): { name: string; n: number; ok: boolean; need: number }[] {
  const need = BRAND_META[coupon.brandId]?.minStore ?? 3;
  return (coupon.stores ?? []).map(([name, n]) => ({ name, n, ok: n >= need, need }));
}

/** 쿠폰의 지금 상태 문구. 사용 시점과 만료를 함께 본다(F20). */
export function couponTiming(coupon: Coupon): { text: string; color: string } {
  if (coupon.life === "used") return { text: "사용 완료", color: COLOR.muted };
  if (coupon.usableMin) return { text: `${coupon.usableMin}분 후 사용 가능`, color: "#B45309" };

  const untilUsable = coupon.usableFrom ? (daysUntil(coupon.usableFrom) ?? 0) : 0;
  if (untilUsable > 1) return { text: `${untilUsable}일 후 사용 가능`, color: "#B45309" };
  if (untilUsable === 1) return { text: "내일부터 사용 가능", color: "#B45309" };

  const left = coupon.date ? daysUntil(coupon.date) : null;
  if (left === null) return { text: "오늘 사용 가능", color: "#047857" };
  if (left < 0) return { text: "만료", color: COLOR.muted };
  if (left === 0) return { text: "오늘 만료", color: "#B91C1C" };
  if (left === 1) return { text: "내일 만료", color: "#B91C1C" };
  if (left <= 3) return { text: `${left}일 남음`, color: "#B91C1C" };
  return { text: `${left}일 남음`, color: "#047857" };
}

/** 브랜드 유의사항. 프로그램 유형에 따라 갈린다(POL26). */
export function brandNotices(brandId: string, program: ProgramKey | null): string[] {
  const meta = programMeta(brandId, program);
  const brand = BRAND_META[brandId];
  const out: string[] = [];

  if (meta?.type === "tier") {
    out.push("스탬프는 매장별로 따로 쌓입니다.");
    out.push("12개는 아메리카노, 20개는 모든 음료 쿠폰으로 교환할 수 있어요.");
    out.push("교환 시점은 직접 선택하며 자동으로 전환되지 않아요.");
  } else if (meta?.type === "store") {
    out.push(`해당 매장에서 스탬프 ${brand?.minStore ?? 3}개 이상 적립 시 쿠폰을 사용할 수 있어요.`);
  } else {
    out.push(`스탬프 ${brand?.goal ?? 10}개를 모으면 쿠폰이 발급돼요.`);
  }

  if (brandId === "paik") out.push("쿠폰은 발급 다음 날부터 사용할 수 있습니다.");
  if (brandId === "mammoth") out.push("일부 특수매장은 적립·사용이 제외될 수 있습니다.");
  out.push("CupPick은 공식 앱의 상태를 기록하는 앱이며 쿠폰을 직접 발급하지 않아요.");
  return out;
}

/** 브랜드에서 가장 먼저 만료되는 항목. 미확인은 세지 않는다. */
export function soonestExpiry(data: BenefitData, brandId: string) {
  const out: { date: string; trust: string; n: number; what: "stamp" | "coupon" }[] = [];

  for (const balance of data.balances) {
    if (balance.brandId !== brandId || balance.composition || balance.conversion) continue;
    for (const bundle of balance.bundles) {
      if (!bundle.date) continue;
      const left = daysUntil(bundle.date);
      if (left === null || left < 0) continue;
      if (bundle.trust !== "confirmed" && bundle.trust !== "estimated") continue;
      out.push({ date: bundle.date, trust: bundle.trust, n: bundle.n, what: "stamp" });
    }
  }

  for (const coupon of data.coupons) {
    if (coupon.brandId !== brandId || coupon.life !== "held" || !coupon.date) continue;
    const left = daysUntil(coupon.date);
    if (left === null || left < 0) continue;
    if (coupon.trust !== "confirmed" && coupon.trust !== "estimated") continue;
    out.push({ date: coupon.date, trust: coupon.trust, n: 1, what: "coupon" });
  }

  out.sort((a, b) => (a.date === b.date ? (a.trust === "confirmed" ? -1 : 1) : a.date < b.date ? -1 : 1));
  return out[0] ?? null;
}

/** 보류·충돌 항목(F11 · F16 · F23). 사유는 서로 독립이다. */
export type PendingItem = {
  id: string;
  kind: "composition" | "conversion" | "conflict";
  balanceId?: string;
  couponId?: string;
  title: string;
  body: string;
  effect: string;
};

export function pendingItems(data: BenefitData): PendingItem[] {
  const out: PendingItem[] = [];

  for (const balance of data.balances) {
    const brandName = BRAND_META[balance.brandId]?.name ?? balance.brandId;

    if (balance.composition) {
      out.push({
        id: `comp:${balance.id}`,
        kind: "composition",
        balanceId: balance.id,
        title: `${brandName} · 구성 확인 필요`,
        body: `현재 잔액 ${balance.qty}개는 그대로 유지합니다. 개수는 같지만 내역이 달라 어떤 묶음이 영향받았는지 특정할 수 없어, 이 잔액의 영향 가능한 기존 묶음 전체를 보류했습니다.`,
        effect: "보류 중: 만료 예정 알림·자동 차감. 다른 브랜드·프로그램 잔액은 그대로 둡니다.",
      });
    }

    if (balance.conversion) {
      out.push({
        id: `conv:${balance.id}`,
        kind: "conversion",
        balanceId: balance.id,
        title: `${brandName} · 전환 확인 필요 ${Math.min(balance.conversion, balance.qty)}개`,
        body: `쿠폰 발급 여부를 알 수 없어 쿠폰을 만들지 않고 잔액 ${balance.qty}개도 그대로 유지했습니다. 전환됐을 가능성이 있는 수량만 보류합니다.`,
        effect: "보류 중: 해당 수량의 만료 자동 차감·알림. 잔액과 다른 묶음은 그대로입니다.",
      });
    }
  }

  for (const coupon of data.coupons) {
    if (coupon.scope !== "conflict" || coupon.life !== "held") continue;
    const brandName = BRAND_META[coupon.brandId]?.name ?? coupon.brandId;
    out.push({
      id: `conflict:${coupon.id}`,
      kind: "conflict",
      couponId: coupon.id,
      title: `${brandName} ${coupon.name} · 조건 확인 필요`,
      body: "서비스가 확인한 공통 정책은 이 매장을 사용 제외로 두고, 사용자가 쿠폰 화면에서 확인한 개별 근거는 사용 가능이라고 합니다. 적용 대상·시행 시점을 비교했지만 해소되지 않았습니다.",
      effect: "해당 쿠폰의 이 매장 조건만 미확인으로 내렸습니다. 날짜·다른 매장 조건·잔액은 그대로입니다.",
    });
  }

  return out;
}

export type MapFilter = "all" | "stamp" | "coupon";

/** 지도 목록의 매장별 판정. 보유·날짜·매장 조건 중 하나로 단정하지 않는다(04 §0.4). */
export function cafeVerdict(
  data: BenefitData,
  cafe: Cafe,
  filter: MapFilter,
): { verdict: string; level: VerdictLevel; basis: string } {
  if (filter === "coupon") {
    const coupon = data.coupons.find(
      (c) => c.brandId === cafe.brandId && c.life === "held" && (!cafe.program || c.programKey === cafe.program),
    );
    if (!coupon) return { verdict: "보유 쿠폰 없음", level: "unk", basis: "미등록과 확인된 0개는 다릅니다." };

    if (coupon.scope === "store") {
      const rows = storeRows(coupon).filter((row) => cafe.name.includes(row.name));
      if (rows.length === 0) return { verdict: "적립 0/3 · 사용 불가", level: "no", basis: "" };
      return rows[0].ok
        ? { verdict: "이 매장에서 사용 가능", level: "ok", basis: "" }
        : { verdict: `적립 ${rows[0].n}/${rows[0].need} · 사용 불가`, level: "no", basis: "" };
    }
    if (coupon.scope === "common") return { verdict: "이 매장에서 사용 가능", level: "ok", basis: "" };
    if (coupon.scope === "listed") {
      return cafe.name.includes("화정역점")
        ? { verdict: "사용 가능", level: "ok", basis: "근거: 사용자가 쿠폰 화면에서 확인 · 일부 목록이라 목록 밖은 미확인" }
        : { verdict: "확인 필요", level: "unk", basis: "일부 목록 밖입니다. 불가가 아니라 미확인입니다." };
    }
    if (coupon.scope === "conflict") {
      return { verdict: "확인 필요", level: "unk", basis: "공통 정책과 개인 확인 근거가 충돌해 이 조건만 확인 필요로 내렸습니다." };
    }
    return { verdict: "확인 필요", level: "unk", basis: "사용 가능 매장을 등록하지 않아 미확인입니다." };
  }

  if (filter === "stamp") {
    const balance =
      data.balances.find(
        (b) =>
          b.brandId === cafe.brandId &&
          (!cafe.program || b.programKey === cafe.program) &&
          (!b.store || cafe.name.includes(b.store)),
      ) ??
      data.balances.find((b) => b.brandId === cafe.brandId && (!cafe.program || b.programKey === cafe.program));

    if (!balance) return { verdict: "스탬프 미등록", level: "unk", basis: "미등록은 확인된 0개가 아닙니다." };
    if (balance.scope === "공통 적립") return { verdict: "적립 가능", level: "ok", basis: "근거: 서비스가 확인한 공통 적립 정책" };
    if (balance.scope === "매장 적립") return { verdict: "적립 가능", level: "ok", basis: "" };
    return { verdict: "확인 필요", level: "unk", basis: "적립 범위를 모르는 잔액입니다. 브랜드 후보만 보여줍니다." };
  }

  return { verdict: "혜택 보유", level: "ok", basis: "" };
}

/** 내 혜택 카드(F06). 잔액이 있으면 잔액 단위, 없으면 쿠폰만 있는 브랜드 단위다. */
export type BenefitCard = {
  key: string;
  brandId: string;
  name: string;
  short: string;
  color: string;
  balance: Balance | null;
  progressText: string;
  goal: number;
  state: string;
  stateColor: string;
  subText: string;
  /** 공식 앱에서 발급·교환한 사실을 기록하는 동작(F15). */
  actions: { label: string; primary: boolean; amount?: number; couponName?: string }[];
  coupons: Coupon[];
  sortKey: number;
};

export function benefitCards(data: BenefitData, sort: "expiry" | "pref"): BenefitCard[] {
  const cards: BenefitCard[] = [];

  for (const brandId of BRAND_ORDER) {
    const meta = BRAND_META[brandId];
    const balances = data.balances.filter((b) => b.brandId === brandId);
    const held = data.coupons.filter((c) => c.brandId === brandId && c.life === "held");
    const units: (Balance | null)[] = balances.length ? balances : held.length ? [null] : [];

    for (const balance of units) {
      const program = balance?.programKey ?? null;
      const programInfo = programMeta(brandId, program);
      const tiers = programInfo?.type === "tier" ? programInfo.tiers : null;
      const goal = programGoal(brandId, program);
      const qty = balance?.qty ?? 0;

      let state = "";
      let stateColor: string = COLOR.muted;
      let subText = "";
      const actions: BenefitCard["actions"] = [];

      if (tiers) {
        if (qty >= tiers[1]) {
          state = "모든 음료 쿠폰으로 교환할 수 있어요";
          stateColor = COLOR.accent;
          actions.push({ label: "공식 앱에서 교환했어요", primary: true, amount: tiers[1], couponName: "모든 음료 쿠폰" });
        } else if (qty >= tiers[0]) {
          state = "아메리카노 쿠폰으로 교환할 수 있어요";
          stateColor = COLOR.accent;
          subText = `${tiers[1] - qty}개 더 모으면 모든 음료 쿠폰`;
          actions.push({ label: "공식 앱에서 교환했어요", primary: true, amount: tiers[0], couponName: "아메리카노 쿠폰" });
          actions.push({ label: "계속 모으기", primary: false });
        } else {
          state = `아메리카노 쿠폰까지 ${tiers[0] - qty}개 남았어요`;
        }
      } else if (balance) {
        if (qty >= goal) {
          state = "쿠폰이 발급될 시점이에요";
          stateColor = COLOR.accent;
          actions.push({ label: "발급된 쿠폰 기록하기", primary: true, amount: goal, couponName: `${meta.name} 쿠폰` });
        } else {
          state = `쿠폰까지 ${goal - qty}개 남았어요`;
        }
      } else {
        state = `쿠폰 ${held.length}장 보유`;
        stateColor = COLOR.accent;
      }

      const mine = balance ? held.filter((c) => c.programKey === balance.programKey) : held;
      let sortKey = 9999;
      for (const coupon of mine) {
        const left = coupon.date ? daysUntil(coupon.date) : null;
        if (left !== null) sortKey = Math.min(sortKey, left);
      }

      cards.push({
        key: balance ? balance.id : brandId,
        brandId,
        name: (balance ? programLabel(brandId, program) : meta.name) + (balance?.store ? ` · ${balance.store}` : ""),
        short: meta.short,
        color: meta.color,
        balance,
        progressText: balance ? `${qty} / ${goal}` : "",
        goal,
        state,
        stateColor,
        subText,
        actions,
        coupons: mine,
        sortKey,
      });
    }
  }

  if (sort === "expiry") return [...cards].sort((a, b) => a.sortKey - b.sortKey);

  return [...cards].sort((a, b) => {
    const ia = PREFERRED_BRANDS.indexOf(a.brandId as (typeof PREFERRED_BRANDS)[number]);
    const ib = PREFERRED_BRANDS.indexOf(b.brandId as (typeof PREFERRED_BRANDS)[number]);
    if (ia < 0 && ib < 0) return a.sortKey - b.sortKey;
    if (ia < 0) return 1;
    if (ib < 0) return -1;
    return ia - ib;
  });
}

/** 만료 임박 알림(F26). 3일 이내이고 날짜가 확인·예상인 것만 담는다. */
export type ExpiryAlert = {
  id: string;
  brandId: string;
  dday: string;
  text: string;
  meta: string;
  color: string;
  urgent: boolean;
};

export function expiryAlerts(data: BenefitData): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];

  for (const coupon of data.coupons) {
    if (coupon.life !== "held" || !coupon.date) continue;
    if (coupon.trust !== "confirmed" && coupon.trust !== "estimated") continue;
    const left = daysUntil(coupon.date);
    if (left === null || left < 0 || left > 3) continue;
    alerts.push({
      id: `coupon:${coupon.id}`,
      brandId: coupon.brandId,
      dday: left === 0 ? "당일" : `D-${left}`,
      text: `${BRAND_META[coupon.brandId]?.name ?? coupon.brandId} ${coupon.name}`,
      meta: `${shortDate(coupon.date)} 만료`,
      color: left === 0 ? "#B91C1C" : coupon.trust === "estimated" ? "#B45309" : "#047857",
      urgent: left === 0,
    });
  }

  for (const balance of data.balances) {
    if (balance.composition || balance.conversion) continue;
    for (const bundle of balance.bundles) {
      if (!bundle.date) continue;
      const left = daysUntil(bundle.date);
      if (left === null || left < 0 || left > 3) continue;
      alerts.push({
        id: `bundle:${balance.id}:${bundle.date}`,
        brandId: balance.brandId,
        dday: left === 0 ? "당일" : `D-${left}`,
        text: `${BRAND_META[balance.brandId]?.name ?? balance.brandId} 스탬프 ${bundle.n}개`,
        meta: `${shortDate(bundle.date)} 만료`,
        color: left === 0 ? "#B91C1C" : "#047857",
        urgent: left === 0,
      });
    }
  }

  return alerts;
}

/** 만료 상태 배지에 쓰는 색. */
export function trustStyle(trust: keyof typeof TRUST) {
  return TRUST[trust];
}

export function verdictStyle(level: VerdictLevel) {
  return VERDICT[level];
}
