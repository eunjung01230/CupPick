"use client";

/**
 * 로그인 유도 시트.
 *
 * 개인 데이터가 필요한 기능에 들어갈 때만 뜬다(05-policy.md POL02.1 ·
 * 04-features.md F01). 인증은 src/app/auth-actions.ts 의 server action이
 * 기존 Auth.js 설정을 그대로 부른다.
 *
 * 문안·색은 docs/design/cuppick -v2/CupPick v2.dc.html 의 sheets.login 이다.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { startSocialLogin } from "@/app/auth-actions.ts";
import styles from "./shell.module.css";

/** auth_accounts.auth_provider 값과 디자인 문안의 짝. */
export const SOCIAL_LOGINS = [
  { provider: "kakao", label: "카카오로 시작하기", className: styles.socialKakao },
  { provider: "naver", label: "네이버로 시작하기", className: styles.socialNaver },
  { provider: "google", label: "Google로 시작하기", className: styles.socialGoogle },
] as const;

export function LoginSheet({ onDismiss }: { onDismiss: () => void }) {
  const dismissRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className={styles.sheetBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div aria-labelledby="login-sheet-title" aria-modal="true" className={styles.sheet} role="dialog">
        <span className={styles.sheetHandle} />
        <h2 className={styles.sheetTitle} id="login-sheet-title">
          혜택을 관리하려면 로그인이 필요해요
        </h2>
        <p className={styles.sheetBody}>내 혜택 확인과 스탬프·쿠폰 등록은 로그인 후 이용할 수 있어요.</p>

        <div className={styles.sheetActions}>
          {SOCIAL_LOGINS.map((social) => (
            <form action={startSocialLogin} key={social.provider}>
              <input name="provider" type="hidden" value={social.provider} />
              {/* 로그인 성공은 요청한 화면으로 복귀한다(F04). */}
              <input name="redirectTo" type="hidden" value={pathname} />
              <button className={`${styles.socialButton} ${social.className}`} type="submit">
                {social.label}
              </button>
            </form>
          ))}
        </div>

        <button className={styles.sheetDismiss} onClick={onDismiss} ref={dismissRef} type="button">
          둘러보기 계속하기
        </button>
      </div>
    </div>
  );
}
