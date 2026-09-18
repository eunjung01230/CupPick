import { auth, signIn, signOut } from "@/auth.ts";

/**
 * 소셜 로그인 검증용 최소 화면이다. 디자인 대상이 아니며 로그인 여부와
 * provider 식별값만 확인한다.
 */
export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main>
        <h1>CupPick</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit">Google로 로그인</button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn("kakao");
          }}
        >
          <button type="submit">Kakao로 로그인</button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn("naver");
          }}
        >
          <button type="submit">Naver로 로그인</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>CupPick</h1>
      <p>로그인 상태: 로그인됨</p>
      <p>authProvider: {session.authProvider ?? "(없음)"}</p>
      <p>providerSubject: {session.providerSubject ?? "(없음)"}</p>
      <p>name: {session.user.name ?? "(없음)"}</p>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button type="submit">로그아웃</button>
      </form>
    </main>
  );
}
