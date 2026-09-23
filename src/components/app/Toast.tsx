"use client";

/**
 * 기록 결과를 알리는 토스트.
 *
 * 출처: docs/design/cuppick -v2/CupPick v2.dc.html 의 toast(). 3.4초 뒤 사라진다.
 */
import { useEffect } from "react";
import { useBenefitStore } from "./BenefitStore.tsx";
import styles from "./shell.module.css";

const VISIBLE_MS = 3400;

export function Toast() {
  const { toast, dismissToast } = useBenefitStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className={styles.toast} role="status">
      {toast}
    </div>
  );
}
