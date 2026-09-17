import { useState, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

type StampBatch = {
  id: string;
  count: number;
  expiryDate: string;      // "" = no limit
  expiryKind: "confirmed" | "estimated";
  onHold: boolean;
};

const BRANDS = [
  {
    id: "mega",
    name: "메가MGC커피",
    color: "#1B4D3E",
    stamp: { current: 8, goal: 10, label: "아메리카노 무료", hold: 0 },
    stampBatches: [
      { id: "mb1", count: 5, expiryDate: "2027-03-31", expiryKind: "confirmed" as const, onHold: false },
      { id: "mb2", count: 3, expiryDate: "2026-12-31", expiryKind: "estimated" as const, onHold: false },
    ] as StampBatch[],
    coupons: [
      { id: "c1", name: "아이스 아메리카노 1+1", expires: "2026-09-20", expiryKind: "confirmed" as const, expiryStatus: "confirmed" as const, usable: "confirmed" as const },
    ],
    nearestMin: 4,
    nearestStore: "서현역점",
    verifiedAt: "2026-09-14 09:12",
  },
  {
    id: "compose",
    name: "컴포즈커피",
    color: "#F5A623",
    stamp: { current: 5, goal: 8, label: "아메리카노 무료", hold: 2 },
    stampBatches: [
      { id: "cb1", count: 3, expiryDate: "2026-11-30", expiryKind: "confirmed" as const, onHold: false },
      { id: "cb2", count: 2, expiryDate: "2026-10-15", expiryKind: "estimated" as const, onHold: true },
    ] as StampBatch[],
    coupons: [],
    nearestMin: 7,
    nearestStore: "서현북광장점",
    verifiedAt: "2026-09-10 14:30",
  },
  {
    id: "paik",
    name: "빽다방",
    color: "#D0021B",
    stamp: { current: 10, goal: 10, label: "전환 가능", hold: 0 },
    stampBatches: [
      { id: "pb1", count: 10, expiryDate: "2026-09-30", expiryKind: "confirmed" as const, onHold: false },
    ] as StampBatch[],
    coupons: [
      { id: "c2", name: "빽사이즈 음료 무료", expires: "2026-09-18", expiryKind: "confirmed" as const, expiryStatus: "unknown" as const, usable: "unknown" as const },
    ],
    nearestMin: 3,
    nearestStore: "서현역점",
    verifiedAt: "2026-09-15 08:01",
  },
  {
    id: "mammoth",
    name: "매머드커피",
    color: "#5B4A3E",
    stamp: { current: 3, goal: 10, label: "아메리카노 무료", hold: 1 },
    stampBatches: [
      { id: "mm1", count: 2, expiryDate: "2027-06-30", expiryKind: "estimated" as const, onHold: false },
      { id: "mm2", count: 1, expiryDate: "2026-10-31", expiryKind: "estimated" as const, onHold: true },
    ] as StampBatch[],
    coupons: [
      { id: "c4", name: "아메리카노 무료 교환권", expires: "", expiryKind: "confirmed" as const, expiryStatus: "no_limit" as const, usable: "confirmed" as const },
    ],
    nearestMin: 12,
    nearestStore: "이매역점",
    verifiedAt: "2026-09-01 11:55",
  },
  {
    id: "ediya",
    name: "이디야",
    color: "#003087",
    stamp: { current: 7, goal: 12, label: "음료 무료", hold: 0 },
    stampBatches: [
      { id: "eb1", count: 4, expiryDate: "2027-01-31", expiryKind: "confirmed" as const, onHold: false },
      { id: "eb2", count: 3, expiryDate: "2026-11-30", expiryKind: "confirmed" as const, onHold: false },
    ] as StampBatch[],
    coupons: [
      { id: "c3", name: "케이크 세트 할인", expires: "2026-10-05", expiryKind: "estimated" as const, expiryStatus: "estimated" as const, usable: "confirmed" as const },
    ],
    nearestMin: 9,
    nearestStore: "분당서현점",
    verifiedAt: "2026-09-13 17:22",
  },
  {
    id: "theVenti",
    name: "더벤티",
    color: "#2C2C2C",
    stamp: { current: 0, goal: 10, label: "아메리카노 무료", hold: 0 },
    stampBatches: [] as StampBatch[],
    coupons: [],
    nearestMin: 15,
    nearestStore: "정자역점",
    verifiedAt: null as string | null,
  },
];

const NEARBY_CAFES = [
  { id: "s1", brandId: "paik",    name: "빽다방 서현역점",        min: 3,  stamp: true, stampUsable: "confirmed" as const, coupon: true,  couponUsable: "unknown"   as const },
  { id: "s2", brandId: "mega",    name: "메가MGC커피 서현역점",   min: 4,  stamp: true, stampUsable: "confirmed" as const, coupon: true,  couponUsable: "confirmed" as const },
  { id: "s3", brandId: "compose", name: "컴포즈커피 서현북광장점", min: 7, stamp: true, stampUsable: "unknown"   as const, coupon: false, couponUsable: "unknown"   as const },
  { id: "s4", brandId: "ediya",   name: "이디야 분당서현점",      min: 9,  stamp: true, stampUsable: "confirmed" as const, coupon: true,  couponUsable: "confirmed" as const },
  { id: "s5", brandId: "mammoth", name: "매머드커피 이매역점",    min: 12, stamp: true, stampUsable: "unknown"   as const, coupon: false, couponUsable: "no"        as const },
];

const NOTIFICATIONS = [
  { id: "n1", type: "expiry" as const, text: "빽다방 빽사이즈 음료 무료 쿠폰이 오늘 만료돼요", time: "오늘 오전 8:00", urgent: true },
  { id: "n2", type: "expiry" as const, text: "메가MGC커피 아이스 아메리카노 1+1 쿠폰이 3일 후 만료돼요", time: "오전 8:00", urgent: false },
  { id: "n3", type: "cleanup" as const, text: "이디야 케이크 세트 할인 쿠폰의 만료일이 예상 날짜예요 — 공식 앱에서 확인해 보세요", time: "어제 오전 8:00", urgent: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  const today = new Date("2026-09-15");
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function expiryLabel(coupon: { expires: string; expiryKind: "confirmed" | "estimated" }) {
  const d = daysUntil(coupon.expires);
  const suffix = coupon.expiryKind === "estimated" ? " (예상)" : "";
  if (d < 0) return `만료됨${suffix}`;
  if (d === 0) return `오늘 만료${suffix}`;
  if (d <= 3) return `D-${d}${suffix}`;
  return `${coupon.expires.slice(5).replace("-", "/")} 만료${suffix}`;
}

function usabilityBadge(usable: "confirmed" | "unknown" | "no") {
  if (usable === "confirmed") return { label: "사용 가능", color: "text-emerald-700 bg-emerald-50" };
  if (usable === "no") return { label: "사용 불가", color: "text-red-700 bg-red-50" };
  return { label: "확인 필요", color: "text-amber-700 bg-amber-50" };
}

function brandById(id: string) {
  return BRANDS.find((b) => b.id === id)!;
}

// ─── Cuppick Logo Mark ────────────────────────────────────────────────────────

function CuppickMark({ size = 80, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: "drop-shadow(0 0 18px rgba(255,220,160,0.55))" } : undefined}
    >
      {/* C arc body */}
      <path
        d="M72 50 A28 28 0 1 1 56 24"
        stroke="#F5E6C8"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* Location pin – sits on top-right of C */}
      <circle cx="60" cy="19" r="7" fill="#F5E6C8" />
      <path d="M60 26 L60 33" stroke="#F5E6C8" strokeWidth="3.5" strokeLinecap="round" />
      {/* Inner hole of pin */}
      <circle cx="60" cy="19" r="2.8" fill="#3A2416" />
      {/* Coffee cup inside C */}
      <rect x="36" y="52" width="24" height="16" rx="4" fill="#F5E6C8" />
      <path d="M60 58 Q67 58 67 64 Q67 68 60 68" stroke="#F5E6C8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="34" y="68" width="28" height="3.5" rx="1.75" fill="#F5E6C8" />
      {/* Coffee bean below */}
      <ellipse cx="50" cy="80" rx="9" ry="6" fill="#F5E6C8" />
      <path d="M50 74.5 Q47 80 50 85.5" stroke="#3A2416" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M50 74.5 Q53 80 50 85.5" stroke="#3A2416" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Auth Screens ─────────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "#3A2416" }}
    >
      {/* Floating icon badges */}
      {[
        { icon: "📍", x: "8%", y: "18%", r: -12 },
        { icon: "☕", x: "78%", y: "13%", r: 8 },
        { icon: "🫘", x: "6%", y: "68%", r: -8 },
        { icon: "C", x: "78%", y: "72%", r: 10 },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg"
          style={{
            left: b.x,
            top: b.y,
            transform: `rotate(${b.r}deg)`,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#F5E6C8",
          }}
        >
          {b.icon}
        </div>
      ))}

      <div className="relative flex flex-col items-center gap-5">
        <CuppickMark size={160} glow />

        <div className="text-center">
          <h1
            className="font-display text-6xl tracking-tight"
            style={{ color: "#F5E6C8", letterSpacing: "-0.01em" }}
          >
            Cuppick
          </h1>
          <p className="text-base mt-3 leading-relaxed" style={{ color: "rgba(245,230,200,0.6)" }}>
            내 주변 카페 스탬프,<br />스마트하게 관리하세요
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-14 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(245,230,200,0.35)",
              animation: `pulse 1.3s ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>

      <p className="absolute bottom-6 text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>
        © 2024 Cuppick Inc.
      </p>
    </div>
  );
}

type SocialProvider = "kakao" | "naver" | "google" | "apple";

const SOCIAL_META: Record<SocialProvider, { label: string; color: string }> = {
  kakao:  { label: "카카오",  color: "#FEE500" },
  naver:  { label: "네이버",  color: "#03C75A" },
  google: { label: "Google",  color: "#4285F4" },
  apple:  { label: "Apple",   color: "#000"    },
};

function LoginScreen({
  onExistingUser,
  onNewUser,
  onGuest,
}: {
  onExistingUser: () => void;
  onNewUser: (provider: SocialProvider) => void;
  onGuest: () => void;
}) {
  const [pending, setPending] = useState<SocialProvider | null>(null);

  function handleSocial(provider: SocialProvider) {
    setPending(provider);
    setTimeout(() => {
      setPending(null);
      if (provider === "kakao") onExistingUser();
      else onNewUser(provider);
    }, 900);
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#3A2416" }}>
      {/* Top brand area */}
      <div className="flex-1 flex flex-col items-center justify-start gap-0 px-8 pt-12 pb-8">
        <CuppickMark size={155} glow />
        <div className="text-center">
          <h1
            className="font-display text-5xl tracking-tight"
            style={{ color: "#F5E6C8", letterSpacing: "-0.01em" }}
          >
            Cuppick
          </h1>
          <p className="text-base mt-3 leading-relaxed" style={{ color: "rgba(245,230,200,0.55)" }}>
            내 주변 카페 스탬프,<br />스마트하게 관리하세요
          </p>
        </div>
      </div>

      {/* Login panel */}
      <div
        className="flex-shrink-0 rounded-t-3xl px-6 pt-6 flex flex-col gap-0"
        style={{ background: "var(--color-background)", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}
      >
        <p className="text-center text-xs font-semibold text-[var(--color-muted-foreground)] tracking-widest uppercase mb-0.5">
          소셜 계정으로 시작하기
        </p>
        <p className="text-center text-[11px] text-[var(--color-muted-foreground)] mb-3">
          이메일 자동 통합 없이 각 소셜 계정별로 독립 관리됩니다.
        </p>

        <div className="flex flex-col gap-2">
          <SocialButton
            icon={<KakaoIcon />}
            label={pending === "kakao" ? "연결 중..." : "카카오로 시작하기"}
            bg="#FEE500"
            textColor="#1A1200"
            onClick={() => handleSocial("kakao")}
            disabled={!!pending}
          />
          <SocialButton
            icon={<NaverIcon />}
            label={pending === "naver" ? "연결 중..." : "네이버로 시작하기"}
            bg="#03C75A"
            textColor="#ffffff"
            onClick={() => handleSocial("naver")}
            disabled={!!pending}
          />
          <SocialButton
            icon={<GoogleIcon />}
            label={pending === "google" ? "연결 중..." : "Google로 시작하기"}
            bg="#fff"
            textColor="#3C4043"
            border
            onClick={() => handleSocial("google")}
            disabled={!!pending}
          />
        </div>

        {/* Guest browse */}
        <button
          onClick={onGuest}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)]"
        >
          로그인 없이 둘러보기
        </button>

        <div className="mt-auto pt-6">
          <p className="text-center text-[11px] text-[var(--color-muted-foreground)] leading-relaxed pb-1">
            계속 진행하면 <span className="underline">이용약관</span> 및{" "}
            <span className="underline">개인정보 처리방침</span>에 동의한 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

const SOCIAL_ICON_BG: Record<SocialProvider, string> = {
  kakao:  "#FEE500",
  naver:  "#03C75A",
  google: "#fff",
  apple:  "#000",
};

function SocialProviderBadge({ provider }: { provider: SocialProvider }) {
  const meta = SOCIAL_META[provider];
  const icons: Record<SocialProvider, React.ReactNode> = {
    kakao:  <KakaoIcon />,
    naver:  <NaverIcon />,
    google: <GoogleIcon />,
    apple:  <AppleIcon />,
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "var(--color-secondary)", border: "1.5px solid var(--color-border)" }}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: SOCIAL_ICON_BG[provider], border: provider === "google" ? "1px solid #DADCE0" : undefined }}
      >
        {icons[provider]}
      </div>
      <div className="flex-1">
        <p className="text-xs text-[var(--color-muted-foreground)]">연결된 소셜 계정</p>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{meta.label} 계정</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-emerald-600">연결됨</span>
      </div>
    </div>
  );
}

function SignUpScreen({ provider, onBack, onDone }: { provider: SocialProvider; onBack: () => void; onDone: () => void }) {
  const [nickname, setNickname] = useState("");
  const [agreeRequired, setAgreeRequired] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDone() {
    if (!nickname.trim()) { setError("닉네임을 입력해 주세요."); return; }
    if (!agreeRequired) { setError("필수 약관에 동의해 주세요."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onDone(); }, 900);
  }

  function toggleAll() {
    const next = !(agreeRequired && agreeMarketing);
    setAgreeRequired(next);
    setAgreeMarketing(next);
    if (next) setError("");
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--color-background)]">
      {/* Dark header */}
      <div
        className="flex-shrink-0 px-5 pt-5 pb-6 flex flex-col gap-4"
        style={{ background: "#3A2416" }}
      >
        {/* Back + step */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium" style={{ color: "rgba(245,230,200,0.4)" }}>신규 계정 가입</span>
          <div className="w-9" />
        </div>

        <div>
          <h2 className="font-display text-3xl" style={{ color: "#F5E6C8" }}>Cuppick 시작하기</h2>
          <p className="text-sm mt-1.5" style={{ color: "rgba(245,230,200,0.55)" }}>
            소셜 계정을 연결하고 프로필을 설정해 주세요
          </p>
        </div>

        {/* Connected social account */}
        <SocialProviderBadge provider={provider} />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(""); }}
            placeholder="커피조아"
            maxLength={12}
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
          />
          <p className="text-xs text-[var(--color-muted-foreground)] text-right mt-1">{nickname.length}/12</p>
        </div>

        {/* Terms */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-muted-foreground)]">약관 동의</label>

          {/* All agree */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
            style={{
              borderColor: agreeRequired && agreeMarketing ? "var(--color-accent)" : "var(--color-border)",
              background: agreeRequired && agreeMarketing ? "rgba(200,119,58,0.06)" : "var(--color-card)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: agreeRequired && agreeMarketing ? "var(--color-accent)" : "var(--color-muted)" }}
            >
              {agreeRequired && agreeMarketing && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">전체 동의</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">필수 및 선택 약관 모두 동의</p>
            </div>
          </button>

          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <TermRow label="[필수] 서비스 이용약관" checked={agreeRequired} onChange={setAgreeRequired} />
            <TermRow label="[필수] 개인정보 처리방침" checked={agreeRequired} onChange={setAgreeRequired} />
            <TermRow label="[선택] 마케팅 정보 수신 동의" checked={agreeMarketing} onChange={setAgreeMarketing} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

      </div>

      {/* CTA */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-6 border-t border-[var(--color-border)] bg-[var(--color-background)]"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
      >
        <button
          onClick={handleDone}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ background: loading ? "#7A6B61" : "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
        >
          {loading ? "가입 중..." : "가입하고 시작하기"}
        </button>
      </div>
    </div>
  );
}

function TermRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between px-4 py-3 text-left bg-[var(--color-card)] hover:bg-[var(--color-secondary)] transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: checked ? "var(--color-accent)" : "transparent",
            border: `1.5px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
          }}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span className="text-sm text-[var(--color-foreground)]">{label}</span>
      </div>
      <svg className="w-4 h-4 text-[var(--color-muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}


// ─── Auth sub-components ──────────────────────────────────────────────────────

function SocialButton({
  icon,
  label,
  bg,
  textColor,
  border,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  textColor: string;
  border?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50"
      style={{
        background: bg,
        color: textColor,
        border: border ? "1px solid #DADCE0" : undefined,
        boxShadow: border ? "0 1px 3px rgba(0,0,0,0.08)" : undefined,
      }}
    >
      {icon}
      {label}
    </button>
  );
}


// ─── Social icons ─────────────────────────────────────────────────────────────

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3A1D1D">
      <path d="M12 3C6.48 3 2 6.69 2 11.26c0 2.87 1.9 5.39 4.77 6.86l-1.2 4.4 4.98-3.3c.47.07.96.1 1.45.1 5.52 0 10-3.69 10-8.24C22 6.69 17.52 3 12 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
    </svg>
  );
}

// ─── Main app sub-components ──────────────────────────────────────────────────

function StampDots({ current, goal }: { current: number; goal: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: goal }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all ${
            i < current
              ? "bg-[var(--color-accent)] shadow-sm"
              : "bg-[var(--color-muted)] border border-[var(--color-border)]"
          }`}
        />
      ))}
    </div>
  );
}

function ExpiryChip({ coupon }: { coupon: { expires: string; expiryKind: "confirmed" | "estimated" } }) {
  const d = daysUntil(coupon.expires);
  const urgent = d <= 3;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        urgent
          ? "bg-red-50 text-red-700"
          : coupon.expiryKind === "estimated"
          ? "bg-amber-50 text-amber-700"
          : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
      }`}
    >
      {expiryLabel(coupon)}
    </span>
  );
}

type ExpiryStatus = "confirmed" | "estimated" | "unknown" | "no_limit";

function ExpiryStatusBadge({ status, expires }: { status: ExpiryStatus; expires?: string }) {
  if (status === "confirmed") {
    const d = expires ? daysUntil(expires) : 999;
    const urgent = d <= 3;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${urgent ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
        {urgent ? (d === 0 ? "오늘 만료 · 확인됨" : `D-${d} · 확인됨`) : "확인됨"}
      </span>
    );
  }
  if (status === "estimated") {
    const d = expires ? daysUntil(expires) : 999;
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
        {d <= 999 && d >= 0 ? `예상 D-${d}` : "예상 D-day"}
      </span>
    );
  }
  if (status === "no_limit") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
        기간 제한 없음
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]">
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      미확인
    </span>
  );
}

function StampHoldBadge({ current, hold }: { current: number; hold: number }) {
  const active = current - hold;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <span className="text-xs font-semibold text-[var(--color-foreground)] bg-[var(--color-secondary)] px-2.5 py-1 rounded-full">
        총 {current}개 <span className="text-[var(--color-muted-foreground)] font-normal">(보류 {hold}개 / 활성 {active}개)</span>
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
        ⚠ 내역 확인 필요
      </span>
    </div>
  );
}

// ─── Main app screens ─────────────────────────────────────────────────────────

// ─── Map helpers ──────────────────────────────────────────────────────────────

type EligibilityState = "confirmed" | "unknown" | "no";

function EligibilityBadge({ state, label }: { state: EligibilityState; label: string }) {
  const styles: Record<EligibilityState, string> = {
    confirmed: "bg-emerald-50 text-emerald-700",
    unknown:   "bg-amber-50 text-amber-700",
    no:        "bg-red-50 text-red-700",
  };
  const dots: Record<EligibilityState, string> = {
    confirmed: "bg-emerald-500",
    unknown:   "bg-amber-500",
    no:        "bg-red-500",
  };
  const texts: Record<EligibilityState, string> = {
    confirmed: "사용 가능",
    unknown:   "미확인",
    no:        "사용 불가",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[state]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[state]}`} />
      {texts[state]} · {label}
    </span>
  );
}

function DirectionsButton({ cafeName }: { cafeName: string }) {
  const [open, setOpen] = useState(false);

  function launch(app: "kakao" | "naver") {
    const q = encodeURIComponent(cafeName);
    const url = app === "kakao"
      ? `https://map.kakao.com/?q=${q}`
      : `https://map.naver.com/v5/search/${q}`;
    window.open(url, "_blank", "noopener");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-accent)] border border-[var(--color-accent)] hover:bg-orange-50 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
        </svg>
        길찾기
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 bottom-full mb-2 z-40 rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xl"
            style={{ background: "var(--color-card)", minWidth: 152 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider px-4 pt-3 pb-1.5">지도 앱 선택</p>
            {(["kakao", "naver"] as const).map((app) => (
              <button
                key={app}
                onClick={() => launch(app)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-secondary)] transition-colors"
              >
                <span className="text-base">{app === "kakao" ? "🟡" : "🟢"}</span>
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {app === "kakao" ? "카카오맵" : "네이버지도"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Map pin marker (no route lines) ─────────────────────────────────────────

function MapPin({
  x, y, brand, label, walkMin, urgent, onClick,
}: {
  x: string; y: string; brand: ReturnType<typeof brandById>;
  label: string; walkMin: number; urgent?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute flex flex-col items-center"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      {/* Pin body */}
      <div className="relative">
        {urgent && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10" />
        )}
        <div
          className="w-10 h-10 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: brand.color }}
        >
          {label}
        </div>
        {/* Tail */}
        <div
          className="w-2.5 h-2.5 mx-auto -mt-1 rotate-45 border-r-2 border-b-2 border-white"
          style={{ backgroundColor: brand.color }}
        />
      </div>
      {/* Walking time label */}
      <span
        className="mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap"
        style={{ background: "rgba(255,255,255,0.93)", color: brand.color }}
      >
        도보 {walkMin}분
      </span>
    </button>
  );
}

// ─── Main map screen ──────────────────────────────────────────────────────────

function MapScreen({ onSelectCafe }: { onSelectCafe: (id: string) => void }) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "stamp" | "coupon">("all");
  const [rangeMin, setRangeMin] = useState(30);
  const [zoom, setZoom] = useState(1);          // 0.7 – 1.6
  const [isOffline] = useState(true);
  const lastSync = "2026-09-15 08:47";

  const filtered = NEARBY_CAFES.filter((c) => {
    if (rangeMin === 30 && c.min > 30) return false;
    if (selectedFilter === "stamp") return c.stamp;
    if (selectedFilter === "coupon") return c.coupon;
    return true;
  });

  // Pins shown on map — subset with fixed positions
  const MAP_PINS = [
    { x: "35%", y: "58%", brandId: "paik",    label: "빽", walkMin: 3,  urgent: true  },
    { x: "48%", y: "44%", brandId: "mega",    label: "메", walkMin: 4,  urgent: false },
    { x: "63%", y: "54%", brandId: "compose", label: "컴", walkMin: 7,  urgent: false },
    { x: "67%", y: "73%", brandId: "ediya",   label: "이", walkMin: 9,  urgent: false },
  ];

  return (
    <div className="flex flex-col h-full">

      {/* ── Offline indicator bar ── */}
      {isOffline && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2"
          style={{ background: "#2C2C2C" }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-xs font-medium text-white/90">
            오프라인 · 마지막 기록 <span className="font-semibold text-amber-300">{lastSync}</span>
          </p>
        </div>
      )}

      {/* ── Map area ── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: isOffline ? "42vh" : "45vh" }}>
        {/* Zoomed map layer */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(170deg, #eae6e0 0%, #dbd5cc 55%, #cec8be 100%)",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
          }}
        >
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mapgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#a89f97" strokeWidth="0.6" opacity="0.4" />
              </pattern>
              <pattern id="blocks" width="108" height="108" patternUnits="userSpaceOnUse">
                <rect x="4" y="4" width="60" height="60" rx="3" fill="#d5cfc6" opacity="0.55" />
                <rect x="72" y="4" width="32" height="28" rx="3" fill="#d5cfc6" opacity="0.45" />
                <rect x="4" y="72" width="28" height="32" rx="3" fill="#d5cfc6" opacity="0.45" />
                <rect x="72" y="40" width="32" height="64" rx="3" fill="#d5cfc6" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blocks)" />
            <rect width="100%" height="100%" fill="url(#mapgrid)" />
          </svg>

          {/* User location dot */}
          <div className="absolute" style={{ left: "47%", top: "50%" }}>
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full opacity-25 animate-ping" />
          </div>

          {/* Cafe pins */}
          {MAP_PINS.map((pin) => {
            const b = brandById(pin.brandId);
            const cafeEntry = NEARBY_CAFES.find((c) => c.brandId === pin.brandId);
            const visible = !cafeEntry || filtered.some((f) => f.brandId === pin.brandId);
            if (!visible) return null;
            return (
              <MapPin
                key={pin.brandId}
                x={pin.x}
                y={pin.y}
                brand={b}
                label={pin.label}
                walkMin={pin.walkMin}
                urgent={pin.urgent}
                onClick={() => onSelectCafe(pin.brandId)}
              />
            );
          })}
        </div>

        {/* ── UI overlays — outside the zoom layer so they don't scale ── */}

        {/* Locale badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-foreground)] shadow-sm flex items-center gap-1 z-10">
          <span>📍</span> 서현역 기준
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
          <button
            onClick={() => setZoom((z) => Math.min(1.6, parseFloat((z + 0.2).toFixed(1))))}
            className="w-9 h-9 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-lg font-bold text-[var(--color-foreground)] hover:bg-white active:scale-95 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            aria-label="확대"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, parseFloat((z - 0.2).toFixed(1))))}
            className="w-9 h-9 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-lg font-bold text-[var(--color-foreground)] hover:bg-white active:scale-95 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            aria-label="축소"
          >
            −
          </button>
        </div>

        {/* Range filter */}
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          {([15, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRangeMin(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                rangeMin === r
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white/90 text-[var(--color-foreground)]"
              }`}
            >
              도보 {r}분
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-background)] flex-shrink-0">
        {(["all", "stamp", "coupon"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedFilter === f
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
            }`}
          >
            {f === "all" ? "전체" : f === "stamp" ? "적립 가능" : "쿠폰 사용"}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">{filtered.length}개 매장</span>
      </div>

      {/* ── Cafe cards ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-[var(--color-muted-foreground)]">
            <p className="text-sm">이 범위에서 해당 매장이 없어요</p>
          </div>
        )}
        {filtered.map((cafe) => {
          const brand = brandById(cafe.brandId);
          const eligibilityState: EligibilityState =
            selectedFilter === "stamp"
              ? cafe.stampUsable
              : selectedFilter === "coupon"
              ? cafe.couponUsable
              : "confirmed";

          return (
            <div
              key={cafe.id}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3"
            >
              {/* Top row: brand + name + walking time */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: brand.color }}
                >
                  {brand.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">{cafe.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    도보 {cafe.min}분
                  </p>
                </div>
                <DirectionsButton cafeName={cafe.name} />
              </div>

              {/* Bottom row: stamp count + eligibility badge (when filter active) */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  {cafe.stamp && (
                    <span className="text-xs font-medium text-[var(--color-primary)] bg-[var(--color-secondary)] px-2 py-0.5 rounded-full">
                      스탬프 {brand.stamp.current}/{brand.stamp.goal}
                    </span>
                  )}
                  {!cafe.coupon && selectedFilter === "coupon" && (
                    <span className="text-xs text-[var(--color-muted-foreground)]">쿠폰 없음</span>
                  )}
                </div>
                {selectedFilter !== "all" && (
                  <EligibilityBadge
                    state={eligibilityState}
                    label={selectedFilter === "stamp" ? "적립" : "쿠폰"}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenefitCard({ brand, onClick }: { brand: (typeof BRANDS)[0]; onClick: () => void }) {
  const nearestExpiry = brand.coupons.length > 0 ? brand.coupons[0] : null;
  const hasHold = brand.stamp.hold > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-md transition-all active:scale-[0.99]"
    >
      {/* Brand header — no distance */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: brand.color }}
        >
          {brand.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{brand.name}</p>
          {brand.stamp.current >= brand.stamp.goal && (
            <p className="text-xs text-[var(--color-accent)] font-semibold mt-0.5">🎉 전환 가능</p>
          )}
        </div>
      </div>

      {/* Stamp row */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--color-muted-foreground)] font-medium">스탬프</span>
          <span className="text-xs font-semibold text-[var(--color-foreground)]">{brand.stamp.current} / {brand.stamp.goal}개</span>
        </div>
        <StampDots current={brand.stamp.current} goal={brand.stamp.goal} />
        {hasHold && (
          <StampHoldBadge current={brand.stamp.current} hold={brand.stamp.hold} />
        )}
      </div>

      {/* Coupon row with status badge */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-muted-foreground)] font-medium">보유 쿠폰 {brand.coupons.length}장</span>
        {nearestExpiry && (
          <ExpiryStatusBadge status={nearestExpiry.expiryStatus} expires={nearestExpiry.expires || undefined} />
        )}
      </div>
    </button>
  );
}

function CaptureUploadScreen({ onBack }: { onBack: () => void }) {
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  function handleUpload() {
    setUploaded(true);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setDone(true);
    }, 1800);
  }

  return (
    <SubScreen title="캡처 올리기" onBack={onBack}>
      <div className="flex flex-col gap-5 px-5 py-6">
        <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
          스탬프·쿠폰이 보이는 앱 화면을 캡처해서 올려주세요.<br />
          자동으로 내용을 인식해 등록합니다.
        </p>

        {!uploaded ? (
          <button
            onClick={handleUpload}
            className="w-full h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors hover:bg-[var(--color-secondary)] active:scale-[0.98]"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--color-secondary)" }}
            >
              <svg className="w-7 h-7 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">사진 선택</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">갤러리에서 캡처 이미지를 올려주세요</p>
            </div>
          </button>
        ) : analyzing ? (
          <div className="w-full h-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">이미지 분석 중...</p>
          </div>
        ) : done ? (
          <div className="flex flex-col gap-4">
            <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-emerald-800">인식 완료</p>
              </div>
              <div className="flex flex-col gap-1.5 pl-10">
                <p className="text-sm text-emerald-900 font-medium">메가MGC커피 · 스탬프 2개</p>
                <p className="text-xs text-emerald-700">만료일 2027-03-31 (확인됨)</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
            >
              등록 완료
            </button>
          </div>
        ) : null}

        <div
          className="rounded-2xl px-4 py-4 flex flex-col gap-1.5"
          style={{ background: "var(--color-secondary)" }}
        >
          <p className="text-xs font-semibold text-[var(--color-foreground)]">인식이 잘 되려면</p>
          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            · 스탬프 개수, 쿠폰 이름, 만료일이 모두 보이게 캡처해 주세요<br />
            · 흐리거나 잘린 이미지는 인식률이 낮을 수 있어요
          </p>
        </div>
      </div>
    </SubScreen>
  );
}

function DirectRegisterScreen({ onBack }: { onBack: () => void }) {
  const [brand, setBrand] = useState("");
  const [type, setType] = useState<"stamp" | "coupon">("stamp");
  const [count, setCount] = useState("");
  const [couponName, setCouponName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!brand.trim()) { setError("브랜드를 선택해 주세요."); return; }
    if (type === "stamp" && !count) { setError("스탬프 개수를 입력해 주세요."); return; }
    if (type === "coupon" && !couponName.trim()) { setError("쿠폰 이름을 입력해 주세요."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 900);
  }

  if (done) {
    return (
      <SubScreen title="직접 등록하기" onBack={onBack}>
        <div className="flex flex-col items-center justify-center h-full gap-5 px-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--color-foreground)]">등록 완료!</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {brand}의 {type === "stamp" ? `스탬프 ${count}개가` : `쿠폰이`} 추가됐어요
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
          >
            확인
          </button>
        </div>
      </SubScreen>
    );
  }

  return (
    <SubScreen title="직접 등록하기" onBack={onBack}>
      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 브랜드 선택 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">브랜드</label>
          <div className="grid grid-cols-3 gap-2">
            {BRANDS.slice(0, 6).map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.name)}
                className="py-2.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: brand === b.name ? b.color : "var(--color-border)",
                  background: brand === b.name ? b.color + "18" : "var(--color-card)",
                  color: brand === b.name ? b.color : "var(--color-foreground)",
                }}
              >
                {b.name.replace("MGC커피", "").replace("커피", "").replace("다방", "다방")}
              </button>
            ))}
          </div>
        </div>

        {/* 종류 선택 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">종류</label>
          <div className="flex gap-2">
            {(["stamp", "coupon"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  borderColor: type === t ? "var(--color-accent)" : "var(--color-border)",
                  background: type === t ? "rgba(200,119,58,0.08)" : "var(--color-card)",
                  color: type === t ? "var(--color-accent)" : "var(--color-foreground)",
                }}
              >
                {t === "stamp" ? "🟤 스탬프" : "🎟 쿠폰"}
              </button>
            ))}
          </div>
        </div>

        {/* 스탬프 개수 / 쿠폰 이름 */}
        {type === "stamp" ? (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">스탬프 개수</label>
            <input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => { setCount(e.target.value); setError(""); }}
              placeholder="예: 3"
              className="w-full px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">쿠폰 이름</label>
            <input
              type="text"
              value={couponName}
              onChange={(e) => { setCouponName(e.target.value); setError(""); }}
              placeholder="예: 아이스 아메리카노 1+1"
              className="w-full px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
            />
          </div>
        )}

        {/* 만료일 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">만료일 <span className="font-normal">(선택)</span></label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-base text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ background: loading ? "#7A6B61" : "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
        >
          {loading ? "등록 중..." : "등록하기"}
        </button>
      </div>
    </SubScreen>
  );
}

function BenefitsScreen({ onSelectBrand }: { onSelectBrand: (id: string) => void }) {
  const [sort, setSort] = useState<"expiry" | "preferred">("expiry");
  const [showRegister, setShowRegister] = useState(false);
  const [registerFlow, setRegisterFlow] = useState<"capture" | "direct" | null>(null);

  const sorted = [...BRANDS].sort((a, b) => {
    if (sort === "expiry") {
      const aExp = a.coupons[0]?.expires ? daysUntil(a.coupons[0].expires) : 999;
      const bExp = b.coupons[0]?.expires ? daysUntil(b.coupons[0].expires) : 999;
      return aExp - bExp;
    }
    return 0;
  });

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with sort (Expiring Soon / Preferred Brand only) */}
      <div className="px-4 pt-2 pb-3 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">내 혜택</h2>
        <div className="flex bg-[var(--color-secondary)] rounded-full p-0.5 gap-0.5">
          {(["expiry", "preferred"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                sort === s ? "bg-white text-[var(--color-foreground)] shadow-sm" : "text-[var(--color-muted-foreground)]"
              }`}
            >
              {s === "expiry" ? "만료 임박" : "선호 브랜드"}
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 flex flex-col gap-3">
        {sorted.map((brand) => (
          <BenefitCard key={brand.id} brand={brand} onClick={() => onSelectBrand(brand.id)} />
        ))}
      </div>

      {/* Floating CTA — 스탬프/쿠폰 등록 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={() => setShowRegister(true)}
          className="pointer-events-auto flex items-center gap-2.5 px-6 py-3.5 rounded-full text-white text-sm font-semibold shadow-lg active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)",
            boxShadow: "0 8px 24px rgba(200,119,58,0.38)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          스탬프/쿠폰 등록
        </button>
      </div>

      {/* Register sheet */}
      {showRegister && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRegister(false)} />
          <div className="relative bg-[var(--color-background)] rounded-t-3xl px-5 pt-5 pb-10 flex flex-col gap-4">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1.5 bg-[var(--color-border)] rounded-full" />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">스탬프 / 쿠폰 등록</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">등록 방법을 선택해 주세요</p>
            {[
              { key: "capture" as const, icon: "📸", label: "캡처 올리기", desc: "앱 화면을 캡처해서 자동 인식" },
              { key: "direct" as const, icon: "✏️", label: "직접 등록하기", desc: "브랜드·스탬프·쿠폰 정보를 직접 입력" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { setShowRegister(false); setRegisterFlow(item.key); }}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-secondary)] transition-colors text-left"
              >
                <span className="text-2xl w-8 text-center flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{item.desc}</p>
                </div>
                <svg className="w-4 h-4 text-[var(--color-muted-foreground)] ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-screens */}
      {registerFlow === "capture" && (
        <div className="absolute inset-0 z-50 bg-[var(--color-background)]">
          <CaptureUploadScreen onBack={() => setRegisterFlow(null)} />
        </div>
      )}
      {registerFlow === "direct" && (
        <div className="absolute inset-0 z-50 bg-[var(--color-background)]">
          <DirectRegisterScreen onBack={() => setRegisterFlow(null)} />
        </div>
      )}
    </div>
  );
}

function AlertsScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-3 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">알림</h2>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className={`flex gap-3 px-4 py-4 ${n.urgent ? "bg-red-50/50" : ""}`}>
            <div
              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                n.type === "expiry" ? (n.urgent ? "bg-red-500" : "bg-[var(--color-accent)]") : "bg-blue-400"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-foreground)] leading-snug">{n.text}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared sub-screen shell ──────────────────────────────────────────────────

function SubScreen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-secondary)] transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--color-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 transition-colors"
      style={{
        width: 44, height: 26,
        borderRadius: 13,
        background: on ? "var(--color-accent)" : "var(--color-muted)",
      }}
    >
      <div
        className="absolute top-1 transition-all bg-white rounded-full shadow"
        style={{ width: 18, height: 18, left: on ? 22 : 4 }}
      />
    </button>
  );
}

function SettingRow({
  label,
  desc,
  toggle,
  onToggle,
  onPress,
  value,
}: {
  label: string;
  desc?: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  value?: string;
}) {
  const inner = (
    <>
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
        {desc && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{desc}</p>}
      </div>
      {onToggle !== undefined ? (
        <Toggle on={!!toggle} onChange={onToggle} />
      ) : (
        <div className="flex items-center gap-1.5">
          {value && <span className="text-xs text-[var(--color-muted-foreground)]">{value}</span>}
          <svg className="w-4 h-4 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M9 18l6-6-6-6" />
          </svg>
        </div>
      )}
    </>
  );

  if (onToggle !== undefined) {
    return (
      <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-card)]">
        {inner}
      </div>
    );
  }

  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-secondary)] transition-colors text-left"
    >
      {inner}
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 pt-5 pb-1.5">
      <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ─── Profile sub-screens ──────────────────────────────────────────────────────

function EditProfileSubScreen({ onBack }: { onBack: () => void }) {
  const [nickname, setNickname] = useState("커피조아");
  const [phone, setPhone] = useState("010-1234-5678");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <SubScreen title="프로필 수정" onBack={onBack}>
      <div className="flex flex-col gap-6 px-5 py-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: "var(--color-secondary)", border: "2px solid var(--color-border)" }}
            >
              ☕
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow"
              style={{ background: "var(--color-accent)" }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M15.232 5.232l3.536 3.536M9 13l-4 1 1-4 9.5-9.5a2.121 2.121 0 013 3L9 13z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-[var(--color-accent)] font-medium">사진 변경</p>
        </div>

        {/* Connected account */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
        >
          <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center flex-shrink-0">
            <KakaoIcon />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)]">연결된 소셜 계정</p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">카카오 계정</p>
          </div>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">연결됨</span>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-muted-foreground)] mb-1.5">닉네임</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
            />
            <p className="text-[10px] text-[var(--color-muted-foreground)] text-right mt-1">{nickname.length}/12</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-muted-foreground)] mb-1.5">전화번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-all"
            />
          </div>
        </div>

        <button
          onClick={save}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: saved ? "#10b981" : "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
        >
          {saved ? "저장됐어요 ✓" : "저장하기"}
        </button>
      </div>
    </SubScreen>
  );
}

function NotificationSettingsSubScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({
    expiry: true, nearby: true, marketing: false, sound: true, vibration: true,
  });
  function set(k: keyof typeof settings, v: boolean) { setSettings((s) => ({ ...s, [k]: v })); }

  return (
    <SubScreen title="알림 설정" onBack={onBack}>
      <SectionHeader label="알림 종류" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow label="쿠폰 만료 임박 알림" desc="만료 3일 전, 당일 알림" toggle={settings.expiry} onToggle={(v) => set("expiry", v)} />
        <SettingRow label="주변 매장 알림" desc="쿠폰·스탬프 사용 가능한 매장 근처" toggle={settings.nearby} onToggle={(v) => set("nearby", v)} />
        <SettingRow label="마케팅·이벤트 알림" desc="새로운 혜택, 프로모션 안내" toggle={settings.marketing} onToggle={(v) => set("marketing", v)} />
      </div>
      <SectionHeader label="알림 방식" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow label="소리" toggle={settings.sound} onToggle={(v) => set("sound", v)} />
        <SettingRow label="진동" toggle={settings.vibration} onToggle={(v) => set("vibration", v)} />
      </div>
      <div className="px-5 pt-5">
        <div
          className="flex items-start gap-3 p-4 rounded-xl text-xs text-[var(--color-muted-foreground)] leading-relaxed"
          style={{ background: "var(--color-secondary)" }}
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          기기 설정에서 Cuppick의 알림 권한이 허용되어 있어야 알림을 받을 수 있어요.
        </div>
      </div>
    </SubScreen>
  );
}

function LocationSettingsSubScreen({ onBack }: { onBack: () => void }) {
  const [always, setAlways] = useState(false);
  const [whileUsing, setWhileUsing] = useState(true);
  const [precision, setPrecision] = useState(true);

  return (
    <SubScreen title="위치 설정" onBack={onBack}>
      <SectionHeader label="위치 권한" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow
          label="앱 사용 중 위치 허용"
          desc="지도 및 주변 매장 검색에 사용"
          toggle={whileUsing}
          onToggle={(v) => { setWhileUsing(v); if (!v) setAlways(false); }}
        />
        <SettingRow
          label="항상 위치 허용"
          desc="백그라운드에서도 주변 매장 알림"
          toggle={always}
          onToggle={(v) => { setAlways(v); if (v) setWhileUsing(true); }}
        />
        <SettingRow
          label="정밀 위치 사용"
          desc="더 정확한 매장 거리 계산"
          toggle={precision}
          onToggle={setPrecision}
        />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-3">
        <div
          className="p-4 rounded-xl"
          style={{ background: "rgba(200,119,58,0.07)", border: "1px solid rgba(200,119,58,0.18)" }}
        >
          <p className="text-xs font-semibold text-[var(--color-foreground)] mb-1">위치 정보 활용 안내</p>
          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            위치 정보는 주변 카페 검색 및 방문 기반 스탬프 적립에만 사용되며,
            제3자에게 제공되거나 마케팅 목적으로 활용되지 않습니다.
          </p>
        </div>
        <button
          className="w-full py-3 rounded-xl border text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
          style={{ borderColor: "var(--color-border)" }}
        >
          기기 설정에서 권한 변경
        </button>
      </div>
    </SubScreen>
  );
}

const TERMS_CONTENT: Record<string, { title: string; body: string }> = {
  service: {
    title: "서비스 이용약관",
    body: `제1조 (목적)\n이 약관은 Cuppick(이하 "회사")이 제공하는 커피 스탬프 및 쿠폰 관리 서비스(이하 "서비스")의 이용에 관한 조건과 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.\n\n제2조 (정의)\n① "서비스"란 회사가 제공하는 커피 브랜드 스탬프 및 쿠폰 통합 관리 서비스를 말합니다.\n② "이용자"란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.\n③ "스탬프"란 이용자가 제휴 카페 방문 시 적립하는 디지털 도장을 말합니다.\n\n제3조 (약관의 효력 및 변경)\n① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.\n② 회사는 합리적인 사유가 있는 경우 약관을 변경할 수 있으며, 변경 시 7일 전 사전 고지합니다.\n\n제4조 (서비스의 제공)\n① 회사는 스탬프 적립 현황 조회, 쿠폰 관리, 주변 매장 안내 서비스를 제공합니다.\n② 서비스는 연중무휴 24시간 제공을 원칙으로 하나, 정기점검 등의 경우 일시 중단될 수 있습니다.`,
  },
  privacy: {
    title: "개인정보 처리방침",
    body: `1. 수집하는 개인정보 항목\n\n[필수]\n· 소셜 계정 식별자(카카오/Google/Apple)\n· 닉네임, 프로필 사진\n· 기기 식별자, 앱 버전\n\n[선택]\n· 전화번호\n· 위치 정보 (매장 검색 시)\n· 마케팅 수신 동의 여부\n\n2. 개인정보 수집 및 이용 목적\n· 서비스 제공 및 계정 관리\n· 스탬프·쿠폰 이력 관리\n· 주변 매장 안내 서비스\n· 만료 임박 쿠폰 알림\n· 서비스 개선 및 통계 분석\n\n3. 개인정보 보유 기간\n· 회원 탈퇴 시까지 보유\n· 탈퇴 후 즉시 파기 (단, 법령에 따른 보존 필요 시 해당 기간 보유)\n\n4. 개인정보의 제3자 제공\n회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.\n\n5. 이용자의 권리\n이용자는 언제든지 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다. 문의: privacy@cuppick.app`,
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    body: `수신 동의 항목\n\n회사는 아래와 같은 마케팅 정보를 발송할 수 있습니다.\n\n· 신규 제휴 카페 브랜드 안내\n· 한정 이벤트 및 프로모션\n· 개인화된 쿠폰·혜택 추천\n· 계절별 특별 캠페인\n\n수신 채널\n\n· 앱 푸시 알림\n· 카카오 알림톡 (선택 시)\n\n동의 철회\n\n설정 > 알림 설정 > 마케팅·이벤트 알림에서 언제든지 수신을 거부할 수 있습니다. 수신 거부 후에도 거래 관련 필수 안내(쿠폰 만료 등)는 계속 발송됩니다.\n\n본 동의는 선택사항으로, 동의하지 않아도 서비스 이용에 제한이 없습니다.`,
  },
};

function TermsViewerSubScreen({ termKey, onBack }: { termKey: keyof typeof TERMS_CONTENT; onBack: () => void }) {
  const content = TERMS_CONTENT[termKey];
  return (
    <SubScreen title={content.title} onBack={onBack}>
      <div className="px-5 py-5">
        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-line">
          {content.body}
        </p>
      </div>
    </SubScreen>
  );
}

function PrivacySettingsSubScreen({ onBack }: { onBack: () => void }) {
  const [termKey, setTermKey] = useState<keyof typeof TERMS_CONTENT | null>(null);
  const [marketing, setMarketing] = useState(false);

  if (termKey) return <TermsViewerSubScreen termKey={termKey} onBack={() => setTermKey(null)} />;

  return (
    <SubScreen title="약관 및 개인정보" onBack={onBack}>
      <SectionHeader label="약관 확인" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow label="서비스 이용약관" onPress={() => setTermKey("service")} />
        <SettingRow label="개인정보 처리방침" onPress={() => setTermKey("privacy")} />
        <SettingRow label="마케팅 정보 수신 동의" onPress={() => setTermKey("marketing")} />
      </div>

      <SectionHeader label="동의 내역 관리" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow
          label="마케팅 정보 수신"
          desc="이벤트·혜택 알림 수신 동의"
          toggle={marketing}
          onToggle={setMarketing}
        />
      </div>

      <SectionHeader label="계정 관리" />
      <div className="divide-y divide-[var(--color-border)]">
        <SettingRow label="개인정보 내려받기" onPress={() => {}} />
        <SettingRow label="계정 탈퇴" onPress={() => {}} />
      </div>

      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] text-[var(--color-muted-foreground)] leading-relaxed">
          문의: privacy@cuppick.app · 개인정보 보호책임자: 김대표 · 최종 수정: 2024년 1월 1일
        </p>
      </div>
    </SubScreen>
  );
}

// ─── Storage Management Sub-Screen ───────────────────────────────────────────

type DeletedBenefitItem = {
  id: string;
  kind: "stamp" | "coupon";
  brand: string;
  brandColor: string;
  name: string;
  deletedAt: string;
  daysLeft: number;
};

type DeletedPhotoItem = {
  id: string;
  filename: string;
  sizeMb: number;
  deletedAt: string;
  hue: number;
};

const DELETED_BENEFITS: DeletedBenefitItem[] = [
  { id: "db1", kind: "coupon", brand: "메가MGC커피", brandColor: "#1B4D3E", name: "아이스 아메리카노 50% 쿠폰", deletedAt: "2026-08-22", daysLeft: 37 },
  { id: "db2", kind: "stamp",  brand: "컴포즈커피",  brandColor: "#F5A623", name: "스탬프 카드 #3 (8/10)',", deletedAt: "2026-09-01", daysLeft: 46 },
  { id: "db3", kind: "coupon", brand: "빽다방",       brandColor: "#D0021B", name: "빽사이즈 무료 교환권",  deletedAt: "2026-09-10", daysLeft: 55 },
  { id: "db4", kind: "stamp",  brand: "이디야",       brandColor: "#003087", name: "스탬프 카드 #1 (12/12)", deletedAt: "2026-09-13", daysLeft: 58 },
];

const DELETED_PHOTOS: DeletedPhotoItem[] = [
  { id: "dp1", filename: "receipt_mega_0901.jpg",    sizeMb: 2.4, deletedAt: "2026-09-01", hue: 145 },
  { id: "dp2", filename: "stamp_compose_0905.jpg",   sizeMb: 1.8, deletedAt: "2026-09-05", hue: 38  },
  { id: "dp3", filename: "coupon_paik_0910.jpg",     sizeMb: 3.1, deletedAt: "2026-09-10", hue: 5   },
  { id: "dp4", filename: "receipt_ediya_0911.jpg",   sizeMb: 2.0, deletedAt: "2026-09-11", hue: 215 },
  { id: "dp5", filename: "stamp_mammoth_0912.jpg",   sizeMb: 1.5, deletedAt: "2026-09-12", hue: 25  },
];

const STORAGE_USED_MB  = 247;
const STORAGE_TOTAL_MB = 300;

function StorageBar({ usedMb, totalMb }: { usedMb: number; totalMb: number }) {
  const pct = Math.min(100, (usedMb / totalMb) * 100);
  const critical = pct >= 80;
  const warn     = pct >= 60;
  const barColor = critical ? "#DC2626" : warn ? "#EA580C" : "#10b981";
  const textColor = critical ? "text-red-600" : warn ? "text-orange-600" : "text-emerald-600";

  return (
    <div
      className="mx-4 my-4 rounded-2xl p-5"
      style={{
        background: critical ? "rgba(220,38,38,0.05)" : warn ? "rgba(234,88,12,0.05)" : "var(--color-card)",
        border: `1.5px solid ${critical ? "rgba(220,38,38,0.25)" : warn ? "rgba(234,88,12,0.2)" : "var(--color-border)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 flex-shrink-0 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">첨부 용량 사용량</span>
        </div>
        {critical && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            용량 부족
          </span>
        )}
        {warn && !critical && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
            주의
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "var(--color-muted)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${textColor}`}>{usedMb} MB</span>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {pct.toFixed(0)}% 사용 중 · 총 {totalMb} MB
        </span>
        <span className="text-xs text-[var(--color-muted-foreground)]">{totalMb - usedMb} MB 남음</span>
      </div>

      {critical && (
        <p className="text-xs text-red-600 mt-3 leading-relaxed font-medium">
          저장 공간이 부족해요. 삭제된 사진을 영구 삭제하면 즉시 용량이 반환됩니다.
        </p>
      )}
    </div>
  );
}

function DeletePermanentlyModal({
  count,
  totalMb,
  onConfirm,
  onCancel,
}: {
  count: number;
  totalMb: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal card */}
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{ background: "var(--color-card)", maxWidth: 380 }}
      >
        {/* Red accent top bar */}
        <div className="h-1.5 bg-red-600 w-full" />

        <div className="px-6 pt-6 pb-5 flex flex-col gap-4">
          {/* Icon */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-foreground)]">사진 영구 삭제</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{count}장 · {totalMb.toFixed(1)} MB 반환</p>
            </div>
          </div>

          {/* Warning text */}
          <div
            className="p-4 rounded-2xl"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            <p className="text-sm text-red-800 leading-relaxed font-medium">
              영구 삭제된 사진은 복구할 수 없으며 저장 용량이 즉시 반환됩니다.
            </p>
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            삭제를 진행하면 선택된 {count}장의 사진이 Cuppick 서버와 기기에서 완전히 제거됩니다.
            이 작업은 취소할 수 없어요.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={onConfirm}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: "#DC2626" }}
            >
              영구 삭제 · {totalMb.toFixed(1)} MB 반환
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageManagementSubScreen({ onBack }: { onBack: () => void }) {
  const [benefits, setBenefits] = useState<DeletedBenefitItem[]>(DELETED_BENEFITS);
  const [photos, setPhotos]     = useState<DeletedPhotoItem[]>(DELETED_PHOTOS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [usedMb, setUsedMb]     = useState(STORAGE_USED_MB);

  const photosMb = photos.reduce((s, p) => s + p.sizeMb, 0);
  const selectedPhotos = photos.filter((p) => selected.has(p.id));
  const selectedMb     = selectedPhotos.reduce((s, p) => s + p.sizeMb, 0);
  const allSelected    = photos.length > 0 && selected.size === photos.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)));
  }

  function restoreBenefit(id: string) {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  }

  function confirmDelete() {
    const freed = selectedMb;
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setUsedMb((prev) => Math.max(0, Math.round((prev - freed) * 10) / 10));
    setSelected(new Set());
    setShowModal(false);
  }

  const daysLeftColor = (d: number) =>
    d <= 7 ? "bg-red-50 text-red-700" : d <= 20 ? "bg-amber-50 text-amber-700" : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]";

  return (
    <SubScreen title="저장소 관리" onBack={onBack}>
      {/* Storage bar */}
      <StorageBar usedMb={usedMb} totalMb={STORAGE_TOTAL_MB} />

      {/* ── Section 1: Deleted Stamps & Coupons ── */}
      <div className="px-5 pt-2 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider">
            삭제된 스탬프 · 쿠폰
          </p>
          <span className="text-xs text-[var(--color-muted-foreground)]">{benefits.length}개</span>
        </div>

        {benefits.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-[var(--color-muted-foreground)]">
            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm">삭제된 항목이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {benefits.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border p-4 flex flex-col gap-3"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                {/* Top: kind badge + brand + name */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: item.brandColor }}
                  >
                    {item.brand[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                          item.kind === "coupon"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
                        }`}
                      >
                        {item.kind === "coupon" ? "쿠폰" : "스탬프"}
                      </span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">{item.brand}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)] leading-snug truncate pr-2">
                      {item.name}
                    </p>
                  </div>
                </div>

                {/* Bottom: timer tag + restore button */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border)]">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${daysLeftColor(item.daysLeft)}`}>
                    {item.daysLeft}일 후 영구 삭제됩니다
                  </span>
                  <button
                    onClick={() => restoreBenefit(item.id)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                    style={{
                      background: "rgba(200,119,58,0.08)",
                      color: "var(--color-accent)",
                      border: "1px solid rgba(200,119,58,0.22)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    복원하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Deleted Photos ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider">
            삭제된 사진
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {photos.length}장 · {photosMb.toFixed(1)} MB
            </span>
            {photos.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-[var(--color-accent)]"
              >
                {allSelected ? "전체 해제" : "전체 선택"}
              </button>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-[var(--color-muted-foreground)]">
            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm">삭제된 사진이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {photos.map((photo) => {
              const isChecked = selected.has(photo.id);
              return (
                <button
                  key={photo.id}
                  onClick={() => toggleSelect(photo.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                  style={{
                    background: isChecked ? "rgba(220,38,38,0.04)" : "var(--color-card)",
                    borderColor: isChecked ? "rgba(220,38,38,0.3)" : "var(--color-border)",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: isChecked ? "#DC2626" : "transparent",
                      border: `2px solid ${isChecked ? "#DC2626" : "var(--color-border)"}`,
                    }}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Thumbnail placeholder */}
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: `hsl(${photo.hue}, 35%, 88%)`,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      style={{ color: `hsl(${photo.hue}, 45%, 45%)` }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">{photo.filename}</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">{photo.sizeMb.toFixed(1)} MB · 삭제일 {photo.deletedAt}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Permanent delete CTA — only when something selected */}
        {selected.size > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)", boxShadow: "0 6px 20px rgba(220,38,38,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택한 사진 영구 삭제 ({selected.size}장 · {selectedMb.toFixed(1)} MB)
          </button>
        )}

        {/* Explanatory footer */}
        <div
          className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl"
          style={{ background: "var(--color-secondary)" }}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-[11px] text-[var(--color-muted-foreground)] leading-relaxed">
            삭제된 항목은 <span className="font-semibold">60일</span>간 보관 후 자동 영구 삭제돼요.
            사진을 영구 삭제하면 저장 용량이 즉시 반환됩니다.
          </p>
        </div>
      </div>

      {/* Permanent delete confirmation modal */}
      {showModal && (
        <DeletePermanentlyModal
          count={selected.size}
          totalMb={selectedMb}
          onConfirm={confirmDelete}
          onCancel={() => setShowModal(false)}
        />
      )}
    </SubScreen>
  );
}

// ─── Profile screen (with sub-screen navigation) ──────────────────────────────

type ProfileSubScreen = "editProfile" | "notifications" | "location" | "privacy" | "storage" | null;

function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [sub, setSub] = useState<ProfileSubScreen>(null);

  if (sub === "editProfile")   return <EditProfileSubScreen onBack={() => setSub(null)} />;
  if (sub === "notifications") return <NotificationSettingsSubScreen onBack={() => setSub(null)} />;
  if (sub === "location")      return <LocationSettingsSubScreen onBack={() => setSub(null)} />;
  if (sub === "privacy")       return <PrivacySettingsSubScreen onBack={() => setSub(null)} />;
  if (sub === "storage")       return <StorageManagementSubScreen onBack={() => setSub(null)} />;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-3 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">내 프로필</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Profile card */}
        <div className="px-4 pt-5 pb-3">
          <button
            onClick={() => setSub("editProfile")}
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left hover:opacity-90 transition-opacity active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #2A1A0E 0%, #3D2B1F 100%)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              ☕
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base">커피조아</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,220,180,0.65)" }}>카카오 계정 연결됨</p>
              <span
                className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5"
                style={{ background: "rgba(200,119,58,0.3)", color: "#FFCEA0" }}
              >
                골드 회원
              </span>
            </div>
            <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 px-4 pb-4">
          {[
            { label: "등록 브랜드", value: "6" },
            { label: "보유 쿠폰", value: "4장" },
            { label: "총 스탬프", value: "33개" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-3 text-center">
              <p className="text-lg font-display text-[var(--color-foreground)]">{s.value}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <SectionHeader label="설정" />
        <div className="divide-y divide-[var(--color-border)]">
          <SettingRow
            label="알림 설정"
            desc="만료 임박·주변 매장·마케팅 알림"
            onPress={() => setSub("notifications")}
          />
          <SettingRow
            label="위치 설정"
            desc="위치 권한 및 정밀도 관리"
            onPress={() => setSub("location")}
          />
          <SettingRow
            label="약관 및 개인정보"
            desc="이용약관·개인정보·동의 내역"
            onPress={() => setSub("privacy")}
          />
          <SettingRow
            label="저장소 관리"
            desc="휴지통 · 첨부 용량 · 영구 삭제"
            value="247 / 300 MB"
            onPress={() => setSub("storage")}
          />
        </div>

        <SectionHeader label="고객지원" />
        <div className="divide-y divide-[var(--color-border)]">
          <SettingRow label="자주 묻는 질문" onPress={() => {}} />
          <SettingRow label="앱 버전" value="1.0.0" onPress={() => {}} />
        </div>

        {/* Logout */}
        <div className="px-5 pt-5 pb-6">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl border text-sm font-semibold text-[var(--color-muted-foreground)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            style={{ borderColor: "var(--color-border)" }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stamp Balance Sheet ──────────────────────────────────────────────────────

type BalanceSheetStage = "review" | "confirmed" | "mismatch";

function StampBalanceSheet({
  brand,
  onClose,
}: {
  brand: (typeof BRANDS)[0];
  onClose: () => void;
}) {
  const [stage, setStage] = useState<BalanceSheetStage>("review");
  const [confirmedAt] = useState("2026-09-15 09:41");

  const totalActive = brand.stampBatches.filter((b) => !b.onHold).reduce((s, b) => s + b.count, 0);
  const totalHeld   = brand.stampBatches.filter((b) =>  b.onHold).reduce((s, b) => s + b.count, 0);
  const hasHold     = totalHeld > 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative rounded-t-3xl flex flex-col"
        style={{ background: "var(--color-background)", maxHeight: "92vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* ── Success: confirmed ── */}
        {stage === "confirmed" && (
          <div className="flex flex-col items-center px-6 pt-6 pb-10 gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--color-foreground)]">잔액 확인 완료</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                확인 시각: <span className="font-semibold">{confirmedAt}</span>
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-3 leading-relaxed">
                만료일은 변경되지 않았어요.<br />총 {brand.stamp.current}개의 스탬프가 기록됐어요.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
            >
              닫기
            </button>
          </div>
        )}

        {/* ── Success: mismatch reported ── */}
        {stage === "mismatch" && (
          <div className="flex flex-col items-center px-6 pt-6 pb-10 gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--color-foreground)]">내역 불일치 접수됨</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">접수 시각: <span className="font-semibold">{confirmedAt}</span></p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-3 leading-relaxed">
                영향받는 스탬프 배치가 <span className="font-semibold text-amber-700">보류(Hold)</span> 상태로 전환됐어요.<br />
                공식 앱에서 내역을 확인하고 다시 업데이트해 주세요.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm"
              style={{ background: "var(--color-secondary)", color: "var(--color-foreground)" }}
            >
              닫기
            </button>
          </div>
        )}

        {/* ── Review stage ── */}
        {stage === "review" && (
          <>
            {/* Header */}
            <div className="px-5 pt-2 pb-4 border-b border-[var(--color-border)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: brand.color }}
                >
                  {brand.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">잔액 확인 · 내역 조정</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{brand.name}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

              {/* ── Total count block ── */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--color-card)", border: "1.5px solid var(--color-border)" }}
              >
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                  총 스탬프 수
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-5xl font-display text-[var(--color-foreground)] leading-none">
                      {brand.stamp.current}
                      <span className="text-lg text-[var(--color-muted-foreground)] font-sans ml-2">/ {brand.stamp.goal}개</span>
                    </p>
                    {hasHold && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          활성 {totalActive}개
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                          보류 {totalHeld}개
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--color-muted-foreground)]">마지막 확인</p>
                    <p className="text-xs font-semibold text-[var(--color-foreground)] mt-0.5">
                      {brand.verifiedAt ?? "미확인"}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (brand.stamp.current / brand.stamp.goal) * 100)}%`,
                      backgroundColor: brand.color,
                    }}
                  />
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  배치별 내역
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              </div>

              {/* ── Breakdown batch cards ── */}
              {brand.stampBatches.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-[var(--color-muted-foreground)]">
                  <p className="text-sm">등록된 배치 내역이 없어요</p>
                  <p className="text-xs mt-1">스탬프를 등록하면 배치가 생성돼요</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {brand.stampBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="rounded-2xl p-4 flex flex-col gap-3"
                      style={{
                        background: batch.onHold ? "rgba(245,158,11,0.04)" : "var(--color-card)",
                        border: `1.5px solid ${batch.onHold ? "rgba(245,158,11,0.3)" : "var(--color-border)"}`,
                      }}
                    >
                      {/* Top: count + hold badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-display text-[var(--color-foreground)] leading-none">
                            {batch.count}
                            <span className="text-sm text-[var(--color-muted-foreground)] font-sans ml-1">개</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Expiry kind tag */}
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              batch.expiryKind === "confirmed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {batch.expiryKind === "confirmed" ? "확인됨" : "예상"}
                          </span>
                          {/* Hold badge */}
                          {batch.onHold && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              ⚠ 보류 중
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expiry date row */}
                      <div
                        className="flex items-center gap-2 pt-3 border-t"
                        style={{ borderColor: batch.onHold ? "rgba(245,158,11,0.2)" : "var(--color-border)" }}
                      >
                        <svg className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          만료일
                          {batch.expiryKind === "estimated" && (
                            <span className="ml-1 text-amber-600">(예상)</span>
                          )}
                        </p>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] ml-auto">
                          {batch.expiryDate ? batch.expiryDate.replace(/-/g, ". ") : "기간 제한 없음"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hold notice */}
              {hasHold && (
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}
                >
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    보류 중인 배치가 있어요. 공식 앱에서 내역을 확인한 뒤 아래 버튼으로 업데이트해 주세요.
                  </p>
                </div>
              )}

              {/* Tracking disclaimer */}
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl"
                style={{ background: "var(--color-secondary)" }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-[11px] text-[var(--color-muted-foreground)] leading-relaxed">
                  CupPick은 추적 서비스예요. 직접 결제·주문·스탬프 적립은 지원하지 않아요.
                </p>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div
              className="flex-shrink-0 px-5 pt-4 pb-8 flex flex-col gap-3 border-t border-[var(--color-border)]"
              style={{ background: "var(--color-background)" }}
            >
              {/* Primary: confirm total count only */}
              <button
                onClick={() => setStage("confirmed")}
                className="w-full py-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg, #1B4D3E 0%, #2D7A5E 100%)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                현재 잔액 확인했어요
              </button>

              {/* Secondary: report breakdown mismatch */}
              <button
                onClick={() => setStage("mismatch")}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all border"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  borderColor: "rgba(245,158,11,0.35)",
                  color: "#92400e",
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                개수는 같지만 내역이 달라요
              </button>

              <p className="text-center text-[10px] text-[var(--color-muted-foreground)]">
                "내역이 달라요"를 누르면 해당 배치가 보류 상태로 전환돼요
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BrandDetailSheet({ brand, onClose }: { brand: (typeof BRANDS)[0]; onClose: () => void }) {
  const [tab, setTab] = useState<"stamps" | "coupons">("stamps");
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-background)] rounded-t-3xl flex flex-col max-h-[88vh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Brand header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: brand.color }}
            >
              {brand.name[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{brand.name}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{brand.nearestStore}</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--color-border)] px-5 flex-shrink-0">
          {(["stamps", "coupons"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-base font-medium transition-colors border-b-2 ${
                tab === t
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-muted-foreground)]"
              }`}
            >
              {t === "stamps" ? `스탬프 (${brand.stamp.current}/${brand.stamp.goal})` : `쿠폰 (${brand.coupons.length}장)`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "stamps" && (
            <div className="flex flex-col gap-6">
              {/* Count + badge */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-[var(--color-muted-foreground)] font-medium mb-1">현재 스탬프</p>
                  <p className="text-5xl font-display text-[var(--color-foreground)]">
                    {brand.stamp.current}
                    <span className="text-xl text-[var(--color-muted-foreground)] font-sans ml-2">/ {brand.stamp.goal}개</span>
                  </p>
                  {brand.stamp.hold > 0 && (
                    <div className="mt-2">
                      <StampHoldBadge current={brand.stamp.current} hold={brand.stamp.hold} />
                    </div>
                  )}
                </div>
                {brand.stamp.current >= brand.stamp.goal && (
                  <span className="text-base font-semibold text-[var(--color-accent)] bg-orange-50 px-4 py-2 rounded-full">
                    🎉 전환 가능!
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-3 bg-[var(--color-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (brand.stamp.current / brand.stamp.goal) * 100)}%`,
                      backgroundColor: brand.color,
                    }}
                  />
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                  {brand.stamp.goal - brand.stamp.current > 0
                    ? `${brand.stamp.goal - brand.stamp.current}개 더 적립하면 ${brand.stamp.label}`
                    : brand.stamp.label}
                </p>
              </div>

              {/* Stamp dots */}
              <StampDots current={brand.stamp.current} goal={brand.stamp.goal} />

              {/* Balance update CTA — no direct payment/order actions */}
              <button
                onClick={() => setShowBalanceSheet(true)}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm text-white active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #C8773A 100%)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                잔액 확인 · 내역 조정
              </button>

              <button className="w-full border border-[var(--color-border)] rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors">
                <span>🗺</span>
                주변 적립 매장 보기
              </button>
            </div>
          )}

          {tab === "coupons" && (
            <div className="flex flex-col gap-4">
              {brand.coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-[var(--color-muted-foreground)]">
                  <p className="text-base">보유한 쿠폰이 없어요</p>
                  <button className="mt-4 text-base font-semibold text-[var(--color-accent)]">+ 쿠폰 등록하기</button>
                </div>
              ) : (
                brand.coupons.map((coupon) => {
                  const badge = usabilityBadge(coupon.usable);
                  return (
                    <div key={coupon.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-base font-semibold text-[var(--color-foreground)] flex-1 leading-snug">{coupon.name}</p>
                        <ExpiryStatusBadge status={coupon.expiryStatus} expires={coupon.expires || undefined} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                        <div className="flex gap-4">
                          <button className="text-base text-[var(--color-accent)] font-semibold">사용 완료</button>
                          <button className="text-base text-[var(--color-muted-foreground)] font-medium">매장 확인</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <button className="w-full border border-[var(--color-border)] rounded-2xl py-4 flex items-center justify-center gap-2 text-base font-medium text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors">
                <span>🗺</span>
                주변 사용 매장 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stamp balance/breakdown sheet — layered above the brand detail */}
      {showBalanceSheet && (
        <StampBalanceSheet brand={brand} onClose={() => setShowBalanceSheet(false)} />
      )}
    </div>
  );
}

// ─── Permissions onboarding ───────────────────────────────────────────────────

const PERMISSION_STEPS = [
  {
    key: "notification",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "알림을 허용해 주세요",
    desc: "쿠폰 만료 전 알림을 받고 혜택을 놓치지 마세요.\n만료 3일 전과 당일에 꼭 알려드릴게요.",
    allow: "알림 허용",
    skip: "나중에",
    color: "#C8773A",
  },
  {
    key: "location",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "위치 정보를 허용해 주세요",
    desc: "내 주변 가까운 카페를 찾고\n방문 시 스탬프를 자동으로 적립해드려요.",
    allow: "위치 허용",
    skip: "나중에",
    color: "#3D7EC8",
  },
] as const;

function PermissionsScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = PERMISSION_STEPS[step];

  function next() {
    if (step < PERMISSION_STEPS.length - 1) setStep(step + 1);
    else onDone();
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--color-background)]">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-6 pb-2 flex-shrink-0">
        {PERMISSION_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === step ? 20 : 8,
              background: i <= step ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Illustration area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{ background: `${current.color}18`, border: `2px solid ${current.color}30`, color: current.color }}
        >
          {current.icon}
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl text-[var(--color-foreground)] mb-3">{current.title}</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-line">{current.desc}</p>
        </div>

        {/* Permission detail pills */}
        <div className="w-full flex flex-col gap-2">
          {current.key === "notification" && [
            "쿠폰 만료 임박 알림",
            "주변 매장 방문 알림",
            "새로운 혜택 안내 (선택)",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: "var(--color-secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: current.color }} />
              <span className="text-sm text-[var(--color-foreground)]">{item}</span>
            </div>
          ))}
          {current.key === "location" && [
            "주변 카페 거리 계산",
            "방문 기반 스탬프 자동 적립",
            "위치 정보는 제3자 미제공",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: "var(--color-secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: current.color }} />
              <span className="text-sm text-[var(--color-foreground)]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-10 flex flex-col gap-2.5 flex-shrink-0">
        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, #3D2B1F 0%, ${current.color} 100%)` }}
        >
          {current.allow}
        </button>
        <button
          onClick={next}
          className="w-full py-3 rounded-xl text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
        >
          {current.skip}
        </button>
      </div>
    </div>
  );
}

// ─── Guest Login Sheet ────────────────────────────────────────────────────────

type GuestTrigger = "register" | "detail";

const GUEST_TRIGGER_COPY: Record<GuestTrigger, { title: string; body: string }> = {
  register: {
    title: "혜택을 등록하려면 로그인이 필요해요",
    body:  "스탬프·쿠폰을 등록하고 브랜드 혜택을 관리하려면 소셜 계정으로 시작해 주세요.",
  },
  detail: {
    title: "매장 상세 혜택은 로그인 후 확인돼요",
    body:  "내 스탬프 현황과 쿠폰 내역은 로그인하면 바로 볼 수 있어요.",
  },
};

function GuestLoginSheet({
  trigger,
  onLogin,
  onDismiss,
}: {
  trigger: GuestTrigger;
  onLogin: (provider: SocialProvider) => void;
  onDismiss: () => void;
}) {
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const copy = GUEST_TRIGGER_COPY[trigger];

  function handleLogin(provider: SocialProvider) {
    setPending(provider);
    setTimeout(() => { setPending(null); onLogin(provider); }, 800);
  }

  const GUEST_SOCIAL_BUTTONS: { provider: SocialProvider; label: string; bg: string; fg: string; border?: boolean; icon: React.ReactNode }[] = [
    { provider: "kakao",  label: "카카오로 시작하기",  bg: "#FEE500", fg: "#1A1200", icon: <KakaoIcon /> },
    { provider: "naver",  label: "네이버로 시작하기",  bg: "#03C75A", fg: "#ffffff", icon: <NaverIcon /> },
    { provider: "google", label: "Google로 시작하기",  bg: "#ffffff", fg: "#3C4043", border: true, icon: <GoogleIcon /> },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10,6,4,0.62)" }}
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        className="relative flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "var(--color-card)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Icon + headline */}
        <div className="px-6 pt-2 pb-5">
          {/* Context icon strip */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(200,119,58,0.12)" }}
            >
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div
              className="h-px flex-1 rounded-full"
              style={{ background: "var(--color-border)" }}
            />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(200,119,58,0.12)" }}
            >
              <CuppickMark size={22} />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-[var(--color-foreground)] leading-snug mb-1.5">
            {copy.title}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            {copy.body}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ background: "var(--color-border)" }} />

        {/* Social buttons */}
        <div className="px-6 pt-5 pb-3 flex flex-col gap-3">
          {GUEST_SOCIAL_BUTTONS.map(({ provider, label, bg, fg, border, icon }) => (
            <button
              key={provider}
              disabled={!!pending}
              onClick={() => handleLogin(provider)}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: pending === provider ? "var(--color-secondary)" : bg,
                color: fg,
                border: border ? "1px solid #DADCE0" : "none",
                boxShadow: border ? "0 1px 3px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {pending === provider ? (
                <span className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: `${fg}40`, borderTopColor: fg }}
                />
              ) : icon}
              {pending === provider ? "연결 중..." : label}
            </button>
          ))}
        </div>

        {/* Account independence disclaimer */}
        <p className="text-center text-[11px] text-[var(--color-muted-foreground)] px-6 mb-3">
          이메일 자동 통합 없이 각 소셜 계정별로 독립 관리됩니다.
        </p>

        {/* Dismiss */}
        <div
          className="px-6 pb-8 pt-1"
          style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}
        >
          <button
            onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors"
            style={{
              background: "transparent",
              color: "var(--color-muted-foreground)",
              border: "1.5px solid var(--color-border)",
            }}
          >
            둘러보기 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Guest Map Screen ─────────────────────────────────────────────────────────

function GuestMapScreen({ onGatedAction }: { onGatedAction: (trigger: GuestTrigger) => void }) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "stamp" | "coupon">("all");

  const filtered = NEARBY_CAFES.filter((c) => {
    if (selectedFilter === "stamp") return c.stamp;
    if (selectedFilter === "coupon") return c.coupon;
    return true;
  });

  const MAP_PINS = [
    { x: "35%", y: "58%", brandId: "paik",    label: "빽", walkMin: 3  },
    { x: "48%", y: "44%", brandId: "mega",    label: "메", walkMin: 4  },
    { x: "63%", y: "54%", brandId: "compose", label: "컴", walkMin: 7  },
    { x: "67%", y: "73%", brandId: "ediya",   label: "이", walkMin: 9  },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Guest banner */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: "linear-gradient(90deg, #3D2B1F 0%, #5A3A25 100%)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-xs font-medium" style={{ color: "rgba(245,230,200,0.85)" }}>
            게스트 모드 · 혜택 관리는 로그인 후 이용 가능
          </p>
        </div>
        <button
          onClick={() => onGatedAction("register")}
          className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
          style={{ background: "rgba(245,230,200,0.15)", color: "#F5E6C8" }}
        >
          로그인
        </button>
      </div>

      {/* Map canvas — freely browsable */}
      <div className="relative flex-shrink-0" style={{ height: "42vh" }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(170deg, #eae6e0 0%, #dbd5cc 55%, #cec8be 100%)" }}
        >
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="guestgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#a89f97" strokeWidth="0.6" opacity="0.4" />
              </pattern>
              <pattern id="guestblocks" width="108" height="108" patternUnits="userSpaceOnUse">
                <rect x="4" y="4" width="60" height="60" rx="3" fill="#d5cfc6" opacity="0.55" />
                <rect x="72" y="4" width="32" height="28" rx="3" fill="#d5cfc6" opacity="0.45" />
                <rect x="4" y="72" width="28" height="32" rx="3" fill="#d5cfc6" opacity="0.45" />
                <rect x="72" y="40" width="32" height="64" rx="3" fill="#d5cfc6" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#guestblocks)" />
            <rect width="100%" height="100%" fill="url(#guestgrid)" />
          </svg>

          {/* User dot */}
          <div className="absolute" style={{ left: "47%", top: "50%" }}>
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full opacity-25 animate-ping" />
          </div>

          {/* Cafe pins — tapping shows login sheet instead of detail */}
          {MAP_PINS.map((pin) => {
            const b = brandById(pin.brandId);
            return (
              <button
                key={pin.brandId}
                onClick={() => onGatedAction("detail")}
                className="absolute flex flex-col items-center"
                style={{ left: pin.x, top: pin.y, transform: "translate(-50%, -100%)" }}
              >
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: b.color }}
                  >
                    {pin.label}
                  </div>
                  <div
                    className="w-2.5 h-2.5 mx-auto -mt-1 rotate-45 border-r-2 border-b-2 border-white"
                    style={{ backgroundColor: b.color }}
                  />
                </div>
                <span
                  className="mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap"
                  style={{ background: "rgba(255,255,255,0.93)", color: b.color }}
                >
                  도보 {pin.walkMin}분
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-foreground)] shadow-sm flex items-center gap-1">
            <span>📍</span> 서현역 기준
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-background)] flex-shrink-0">
        {(["all", "stamp", "coupon"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedFilter === f
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
            }`}
          >
            {f === "all" ? "전체" : f === "stamp" ? "적립 가능" : "쿠폰 사용"}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">{filtered.length}개 매장</span>
      </div>

      {/* Cafe cards — walk time visible, benefits gated */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {filtered.map((cafe) => {
          const brand = brandById(cafe.brandId);
          return (
            <div
              key={cafe.id}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3"
            >
              {/* Brand + walk time — freely visible */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: brand.color }}
                >
                  {brand.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">{cafe.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    도보 {cafe.min}분
                  </p>
                </div>
              </div>

              {/* Gated row — login required */}
              <div
                className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span className="text-xs text-[var(--color-muted-foreground)]">혜택 정보는 로그인 후 확인</span>
                </div>
                <button
                  onClick={() => onGatedAction("detail")}
                  className="text-xs font-semibold text-[var(--color-accent)] px-3 py-1.5 rounded-xl transition-colors"
                  style={{ background: "rgba(200,119,58,0.08)", border: "1px solid rgba(200,119,58,0.2)" }}
                >
                  매장 상세 혜택
                </button>
              </div>
            </div>
          );
        })}

        {/* Register CTA */}
        <button
          onClick={() => onGatedAction("register")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-semibold transition-colors"
          style={{ borderColor: "rgba(200,119,58,0.4)", color: "var(--color-accent)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          혜택 등록하기 (로그인 필요)
        </button>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

type Screen = "splash" | "login" | "guest" | "signup" | "permissions" | "app";
type Tab = "map" | "benefits" | "alerts" | "profile";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [socialProvider, setSocialProvider] = useState<SocialProvider>("kakao");
  const [activeTab, setActiveTab] = useState<Tab>("benefits");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [guestLoginTrigger, setGuestLoginTrigger] = useState<GuestTrigger | null>(null);
  const [showCafeSearch, setShowCafeSearch] = useState(false);
  const [cafeQuery, setCafeQuery] = useState("");

  const brand = selectedBrand ? BRANDS.find((b) => b.id === selectedBrand) : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "map",
      label: "지도",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
        </svg>
      ),
    },
    {
      id: "benefits",
      label: "내 혜택",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
    {
      id: "alerts",
      label: "알림",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "프로필",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const unreadCount = NOTIFICATIONS.filter((n) => n.urgent).length;

  return (
    <div className="flex flex-col bg-[var(--color-background)]" style={{ height: "100dvh" }}>
        {/* Screen router */}
        <div className="flex-1 relative overflow-hidden">
          {screen === "splash" && (
            <SplashScreen onDone={() => setScreen("login")} />
          )}

          {screen === "login" && (
            <LoginScreen
              onExistingUser={() => setScreen("app")}
              onNewUser={(provider) => { setSocialProvider(provider); setScreen("signup"); }}
              onGuest={() => setScreen("guest")}
            />
          )}

          {screen === "guest" && (
            <div className="absolute inset-0 flex flex-col bg-[var(--color-background)]">
              {/* Guest app header */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-background)]"
                style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
              >
                <div className="flex items-center gap-2">
                  <CuppickMark size={28} />
                  <span className="font-display text-lg text-[var(--color-foreground)]">Cuppick</span>
                </div>
                <button
                  onClick={() => setScreen("login")}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: "var(--color-secondary)",
                    color: "var(--color-accent)",
                    border: "1px solid rgba(200,119,58,0.25)",
                  }}
                >
                  로그인
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <GuestMapScreen onGatedAction={(trigger) => setGuestLoginTrigger(trigger)} />
              </div>

              {/* Guest login sheet overlay */}
              {guestLoginTrigger && (
                <GuestLoginSheet
                  trigger={guestLoginTrigger}
                  onLogin={(provider) => {
                    setGuestLoginTrigger(null);
                    setSocialProvider(provider);
                    if (provider === "kakao") setScreen("app");
                    else setScreen("signup");
                  }}
                  onDismiss={() => setGuestLoginTrigger(null)}
                />
              )}
            </div>
          )}

          {screen === "signup" && (
            <SignUpScreen
              provider={socialProvider}
              onBack={() => setScreen("login")}
              onDone={() => setScreen("permissions")}
            />
          )}

          {screen === "permissions" && (
            <PermissionsScreen onDone={() => setScreen("app")} />
          )}

          {screen === "app" && (
            <div className="absolute inset-0 flex flex-col">
              {/* App header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-background)]" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
                <div className="flex items-center gap-2">
                  <CuppickMark size={28} />
                  <span className="font-display text-lg text-[var(--color-foreground)]">Cuppick</span>
                </div>
                <button
                  onClick={() => setShowCafeSearch(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-secondary)] transition-colors"
                  aria-label="매장 검색"
                >
                  <svg className="w-5 h-5 text-[var(--color-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === "map" && <MapScreen onSelectCafe={(id) => setSelectedBrand(id)} />}
                {activeTab === "benefits" && <BenefitsScreen onSelectBrand={(id) => setSelectedBrand(id)} />}
                {activeTab === "alerts" && <AlertsScreen />}
                {activeTab === "profile" && <ProfileScreen onLogout={() => { setScreen("login"); setActiveTab("benefits"); }} />}
              </div>

              {/* Bottom nav */}
              <div
                className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)]"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
              >
                <div className="flex">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 relative transition-all"
                      >
                        <div className="relative">
                          <span
                            className="transition-colors"
                            style={{ color: isActive ? "var(--color-accent)" : "var(--color-muted-foreground)" }}
                          >
                            {tab.icon}
                          </span>
                          {tab.id === "alerts" && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[10px] font-semibold transition-colors"
                          style={{ color: isActive ? "var(--color-accent)" : "var(--color-muted-foreground)" }}
                        >
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--color-accent)] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Brand detail sheet */}
      {brand && screen === "app" && (
        <BrandDetailSheet brand={brand} onClose={() => setSelectedBrand(null)} />
      )}

      {/* Cafe search overlay */}
      {showCafeSearch && screen === "app" && (() => {
        const q = cafeQuery.trim().toLowerCase();
        const results = BRANDS.filter((b) =>
          !q || b.name.toLowerCase().includes(q) || b.nearestStore.toLowerCase().includes(q)
        );
        return (
          <div className="fixed inset-0 z-[55] flex flex-col" style={{ background: "var(--color-background)" }}>
            {/* Search bar */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 pb-3 border-b border-[var(--color-border)]"
              style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
            >
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl" style={{ background: "var(--color-secondary)" }}>
                <svg className="w-4 h-4 flex-shrink-0 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  autoFocus
                  value={cafeQuery}
                  onChange={(e) => setCafeQuery(e.target.value)}
                  placeholder="매장 이름으로 검색"
                  className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
                />
                {cafeQuery && (
                  <button onClick={() => setCafeQuery("")} className="text-[var(--color-muted-foreground)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowCafeSearch(false); setCafeQuery(""); }}
                className="text-sm font-semibold text-[var(--color-accent)] flex-shrink-0"
              >
                취소
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {results.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-[var(--color-muted-foreground)]">
                  <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <p className="text-sm">"{cafeQuery}" 검색 결과가 없어요</p>
                </div>
              ) : (
                results.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBrand(b.id); setShowCafeSearch(false); setCafeQuery(""); }}
                    className="flex items-center gap-3 p-4 rounded-2xl border text-left hover:bg-[var(--color-secondary)] transition-colors"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{b.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{b.nearestStore}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium text-[var(--color-primary)] bg-[var(--color-secondary)] px-2 py-0.5 rounded-full">
                        스탬프 {b.stamp.current}/{b.stamp.goal}
                      </span>
                      {b.coupons.length > 0 && (
                        <span className="text-xs text-[var(--color-muted-foreground)]">쿠폰 {b.coupons.length}장</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
