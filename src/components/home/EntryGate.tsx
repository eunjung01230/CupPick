"use client";

/**
 * 새 실행 진입: 로고 스플래시 → (비로그인) 시작 화면 → 홈.
 *
 * docs/02-workflow.md WF-01.0 · 04-features.md F01 · 05-policy.md POL02.1.
 * - 시작 화면은 소셜 로그인과 '로그인 없이 둘러보기'를 항상 함께 둔다.
 * - 로그인 상태면 스플래시 뒤 바로 홈으로 간다.
 * - 같은 세션 안의 새로고침·로그인 복귀에는 다시 띄우지 않는다.
 *
 * 홈은 이 화면 아래에 이미 그려져 있고, 여기서는 덮개만 걷어낸다.
 * 문안·색은 docs/design/cuppick -v2/CupPick v2.dc.html 의 splash · login 단계다.
 */
import { useEffect, useRef, useState } from "react";
import { startSocialLogin } from "@/app/auth-actions.ts";
import { SOCIAL_LOGINS } from "./LoginSheet.tsx";
import homeStyles from "./HomeScreen.module.css";
import styles from "./EntryGate.module.css";

type EntryStage = "splash" | "start" | "done";

/** 디자인의 스플래시 자동 전환 시간. */
const SPLASH_DURATION_MS = 2600;

/** 이번 세션에서 진입을 마쳤는지. 탭을 닫으면 사라져 다음 실행에 다시 뜬다. */
const ENTERED_KEY = "cuppick.entered";

function hasEntered(): boolean {
  try {
    return window.sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 매번 진입 화면을 보여준다.
    return false;
  }
}

function markEntered(): void {
  try {
    window.sessionStorage.setItem(ENTERED_KEY, "1");
  } catch {
    // 기록하지 못해도 진입 자체는 계속 진행한다. 다음 새로고침에 다시 뜰 뿐이다.
  }
}

const TAGLINE = (
  <>
    내 스탬프·쿠폰을 한곳에 모으고,
    <br />
    오늘 쓸 수 있는 가까운 카페를 찾아보세요
  </>
);

export function EntryGate({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [stage, setStage] = useState<EntryStage>("splash");
  const firstActionRef = useRef<HTMLButtonElement>(null);

  const finish = () => {
    markEntered();
    setStage("done");
  };

  const leaveSplash = () => {
    if (isAuthenticated) finish();
    else setStage("start");
  };

  useEffect(() => {
    if (hasEntered()) {
      setStage("done");
      return;
    }
    const timer = window.setTimeout(leaveSplash, SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
    // 새 실행 한 번만 판단한다. 로그인 상태는 서버가 이 화면을 그릴 때 이미 정해져 있다.
  }, []);

  useEffect(() => {
    if (stage === "start") firstActionRef.current?.focus();
  }, [stage]);

  // 덮개가 떠 있는 동안 아래 홈이 스크롤되지 않게 한다.
  const covering = stage !== "done";
  useEffect(() => {
    if (!covering) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [covering]);

  if (stage === "done") return null;

  if (stage === "splash") {
    return (
      <button aria-label="CupPick 시작하기" className={styles.splash} onClick={leaveSplash} type="button">
        <span aria-hidden="true" className={`${styles.floatTile} ${styles.tilePin}`}>
          📍
        </span>
        <span aria-hidden="true" className={`${styles.floatTile} ${styles.tileCup}`}>
          ☕
        </span>
        <span aria-hidden="true" className={`${styles.floatTile} ${styles.tileBean}`}>
          🫘
        </span>
        <span aria-hidden="true" className={`${styles.floatTile} ${styles.tileLetter}`}>
          C
        </span>

        <span aria-hidden="true" className={styles.splashMark}>
          C
        </span>
        <span className={styles.splashText}>
          <span className={styles.splashTitle}>CupPick</span>
          <span className={styles.tagline}>{TAGLINE}</span>
        </span>

        <span aria-hidden="true" className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </button>
    );
  }

  return (
    <div aria-labelledby="entry-start-title" aria-modal="true" className={styles.start} role="dialog">
      <div className={styles.startBrand}>
        <span aria-hidden="true" className={styles.startMark}>
          C
        </span>
        <div className={styles.startText}>
          <h1 className={styles.startTitle} id="entry-start-title">
            CupPick
          </h1>
          <p className={styles.tagline}>{TAGLINE}</p>
        </div>
      </div>

      <div className={styles.startPanel}>
        <div className={styles.startLabel}>시작하기</div>
        <div className={styles.startActions}>
          {SOCIAL_LOGINS.map((social, index) => (
            // 로그인 복귀 때 진입 화면을 다시 띄우지 않도록 제출 전에 기록한다.
            <form action={startSocialLogin} key={social.provider} onSubmit={markEntered}>
              <input name="provider" type="hidden" value={social.provider} />
              <input name="redirectTo" type="hidden" value="/" />
              <button
                className={`${homeStyles.socialButton} ${social.className} ${styles.startSocial}`}
                ref={index === 0 ? firstActionRef : undefined}
                type="submit"
              >
                {social.label}
              </button>
            </form>
          ))}
        </div>
        <button className={styles.guestButton} onClick={finish} type="button">
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  );
}
