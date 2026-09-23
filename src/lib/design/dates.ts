/**
 * 날짜 계산.
 *
 * 04-features.md §0.7: 시간 표현은 저장하지 않고 실행 시점의 실제 날짜로
 * 계산한다. 시안의 특정 날짜를 기준일로 고정하지 않는다.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 dd · rel · relmd · md.
 */

/** 오늘 자정. 남은 일수 계산의 기준이다. */
function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const DAY_MS = 86_400_000;

/** ISO 날짜까지 남은 일수. 값이 없으면 null. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return Math.round((new Date(year, month - 1, day).getTime() - today().getTime()) / DAY_MS);
}

/** 오늘로부터 n일 뒤의 ISO 날짜. 표본 데이터를 오늘 기준으로 만드는 데 쓴다. */
export function isoFromToday(days: number): string {
  const date = new Date(today().getTime() + days * DAY_MS);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 오늘로부터 n일 뒤의 MM.DD. 적립 내역 표시에 쓴다. */
export function monthDayFromToday(days: number): string {
  const date = new Date(today().getTime() + days * DAY_MS);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/** ISO 날짜를 M/D로 줄인다. */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}
