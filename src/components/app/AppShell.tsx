"use client";

/**
 * 4탭 앱 셸. 헤더 · 하단 탭 · 토스트 · 로그인 유도 시트를 담는다.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 sApp 영역.
 * 비로그인은 지도만 열 수 있고 나머지 탭은 로그인으로 연결한다(POL02.1).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { expiryAlerts } from "@/lib/design/derive.ts";
import { useBenefitStore } from "./BenefitStore.tsx";
import { LoginSheet } from "./LoginSheet.tsx";
import { Toast } from "./Toast.tsx";
import styles from "./shell.module.css";

const TABS = [
  { href: "/", label: "지도", mark: "◈", gated: false },
  { href: "/benefits", label: "내 혜택", mark: "▤", gated: true },
  { href: "/alerts", label: "알림", mark: "◔", gated: true },
  { href: "/profile", label: "프로필", mark: "◍", gated: true },
] as const;

export function AppShell({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { data } = useBenefitStore();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const unread = isAuthenticated ? expiryAlerts(data).length : 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandName}>CupPick</span>
        </div>
        {!isAuthenticated && (
          <button className={styles.headerAction} onClick={() => setLoginSheetOpen(true)} type="button">
            로그인
          </button>
        )}
      </header>

      <div className={styles.content}>{children}</div>

      <nav className={styles.bottomNav}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const className = `${styles.navItem} ${active ? styles.navItemActive : ""}`;
          const body = (
            <>
              <span className={styles.navMark}>
                {tab.mark}
                {tab.href === "/alerts" && unread > 0 && <span className={styles.navBadge}>{unread}</span>}
              </span>
              <span className={styles.navLabel}>{tab.label}</span>
            </>
          );

          // 개인 데이터 탭은 로그인 후에만 연다. 버튼을 감추는 대신 로그인으로 연결한다.
          if (tab.gated && !isAuthenticated) {
            return (
              <button className={className} key={tab.href} onClick={() => setLoginSheetOpen(true)} type="button">
                {body}
              </button>
            );
          }

          return (
            <Link className={className} href={tab.href} key={tab.href}>
              {body}
            </Link>
          );
        })}
      </nav>

      <Toast />
      {loginSheetOpen && <LoginSheet onDismiss={() => setLoginSheetOpen(false)} />}
    </div>
  );
}
