import type { Metadata } from "next";
import { auth } from "@/auth.ts";
import { endSession, startSocialLogin } from "@/app/auth-actions.ts";

/**
 * 소셜 로그인 검증용 최소 화면이다. 디자인 대상이 아니며 로그인 여부와
 * provider 식별값만 확인한다.
 *
 * 사용자 화면(`/`)에는 이 정보를 노출하지 않는다. 여기 보이는 값은 모두
 * 지금 로그인한 본인의 session 값이다. 검색 노출만 막고 경로는 공개하지 않는다.
 */
export const metadata: Metadata = {
  title: "CupPick 인증 확인",
  robots: { index: false, follow: false },
};

/** 로그인·로그아웃 뒤 이 화면으로 돌아와야 결과를 확인할 수 있다. */
const RETURN_PATH = "/dev/auth";

const PROVIDERS = [
  { id: "google", label: "Google로 로그인" },
  { id: "kakao", label: "Kakao로 로그인" },
  { id: "naver", label: "Naver로 로그인" },
];

export default async function DevAuthPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main>
        <h1>CupPick 인증 확인</h1>
        <p>로그인 상태: 로그인되지 않음</p>
        {PROVIDERS.map((provider) => (
          <form action={startSocialLogin} key={provider.id}>
            <input name="provider" type="hidden" value={provider.id} />
            <input name="redirectTo" type="hidden" value={RETURN_PATH} />
            <button type="submit">{provider.label}</button>
          </form>
        ))}
      </main>
    );
  }

  return (
    <main>
      <h1>CupPick 인증 확인</h1>
      <p>로그인 상태: 로그인됨</p>
      <p>authProvider: {session.authProvider ?? "(없음)"}</p>
      <p>providerSubject: {session.providerSubject ?? "(없음)"}</p>
      <p>userId: {session.user.id ?? "(없음)"}</p>
      <p>name: {session.user.name ?? "(없음)"}</p>
      <form action={endSession}>
        <input name="redirectTo" type="hidden" value={RETURN_PATH} />
        <button type="submit">로그아웃</button>
      </form>
    </main>
  );
}
