/**
 * 디자인이 데이터에 따라 바꾸는 색.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 상단 상수.
 * 레이아웃 색은 src/app/globals.css 토큰을 쓰고, 여기에는 상태에 따라
 * 런타임에 골라야 하는 값만 둔다.
 */

export const COLOR = {
  foreground: "#1C1410",
  muted: "#7A6B61",
  accent: "#C8773A",
  primary: "#3D2B1F",
  border: "#E2DDD8",
  secondary: "#F0EDE8",
} as const;

export const GRADIENT_CTA = "linear-gradient(135deg,#3D2B1F 0%,#C8773A 100%)";

/** 날짜 신뢰 수준(POL12 · F12). */
export type TrustLevel = "confirmed" | "estimated" | "unknown" | "none";

export const TRUST: Record<TrustLevel, { label: string; color: string; bg: string }> = {
  confirmed: { label: "확인됨", color: "#047857", bg: "#ECFDF5" },
  estimated: { label: "예상", color: "#B45309", bg: "#FFFBEB" },
  unknown: { label: "미확인", color: COLOR.muted, bg: COLOR.secondary },
  none: { label: "기간 제한 없음", color: "#4F46E5", bg: "#EEF2FF" },
};

/** 사용·적립 가능 여부 판정(POL14 · POL15). */
export type VerdictLevel = "ok" | "unk" | "no";

export const VERDICT: Record<VerdictLevel, { color: string; bg: string }> = {
  ok: { color: "#047857", bg: "#ECFDF5" },
  unk: { color: "#B45309", bg: "#FFFBEB" },
  no: { color: "#B91C1C", bg: "#FEF2F2" },
};
