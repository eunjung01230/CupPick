/**
 * Auth.js v5 공통 설정.
 *
 * JWT session 전략이며 database adapter를 쓰지 않는다. 계정 식별과 생성은
 * src/server/auth-accounts.ts가 맡고, 여기서는 OAuth가 준 식별값을 그 helper에
 * 넘긴 뒤 결과인 내부 users.id를 JWT와 session으로 옮기는 경로만 만든다.
 *
 * client id/secret과 AUTH_SECRET은 코드에 두지 않는다. Auth.js v5가
 * AUTH_SECRET과 provider별 AUTH_<PROVIDER>_ID · AUTH_<PROVIDER>_SECRET
 * 환경변수를 규칙대로 자동으로 읽는다(GOOGLE · KAKAO · NAVER).
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
// 아래 declare module "next-auth/jwt"가 해석되려면 모듈이 프로그램에 올라와야 한다.
import type {} from "next-auth/jwt";
import { resolveUserId, toAuthProvider } from "@/server/auth-accounts.ts";

/**
 * auth_accounts.auth_provider · auth_accounts.provider_subject와 짝이 되는 식별값.
 * 내부 사용자 id는 session.user.id로 나간다(Auth.js가 이미 가진 칸이다).
 */
declare module "next-auth" {
  interface Session {
    authProvider?: string;
    providerSubject?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: string;
    providerSubject?: string;
    /** CupPick 내부 users.id. 제공자가 준 subject가 아니다. */
    userId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Kakao, Naver],
  session: { strategy: "jwt" },
  callbacks: {
    // account는 최초 로그인 때만 들어온다. 그 뒤 호출은 token에 남은 값을 쓰며
    // DB를 다시 보지 않는다.
    async jwt({ token, account, user }) {
      if (!account) return token;

      const provider = toAuthProvider(account.provider);

      if (!provider) {
        // auth_accounts.auth_provider가 받지 않는 값이다. 로그인시키지 않는다.
        throw new Error(`Unsupported auth provider: ${account.provider}`);
      }

      // 조회·생성이 실패하면 그대로 올라가 로그인 자체가 실패한다.
      // 내부 id 없이 로그인된 것처럼 두지 않는다.
      token.userId = await resolveUserId({
        provider,
        providerSubject: account.providerAccountId,
        providerEmail: user?.email ?? null,
      });
      token.authProvider = provider;
      token.providerSubject = account.providerAccountId;

      return token;
    },
    session({ session, token }) {
      session.authProvider = token.authProvider;
      session.providerSubject = token.providerSubject;
      // JWT 전략의 기본 session.user는 name · email · image뿐이고 id는 비어 있다
      // (@auth/core lib/actions/session). 값이 있을 때만 채워도 제공자 subject 같은
      // 다른 값이 내부 id 자리에 남는 일은 없다.
      //
      // 타입은 id를 string으로 보지만 이 변경 이전에 발급된 token에는 userId가 없어
      // 실제로는 undefined일 수 있다. 읽는 쪽에서 그대로 믿지 않는다.
      if (token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
