import { auth } from "@/auth.ts";
import { HomeScreen } from "@/components/home/HomeScreen.tsx";

/**
 * 홈. 로그인 없이도 지도와 주변 카페를 둘러볼 수 있다(F01 · POL02.1).
 *
 * 여기서는 로그인 여부만 화면에 넘긴다. 제공자 식별값 같은 인증 세부는
 * 사용자 화면에 노출하지 않는다. 확인용 화면은 /dev/auth에 있다.
 */
export default async function HomePage() {
  const session = await auth();

  return <HomeScreen isAuthenticated={Boolean(session?.user)} />;
}
