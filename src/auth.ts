/**
 * Auth.js v5 공통 설정.
 *
 * JWT session 전략이며 database adapter를 쓰지 않는다. users 테이블 연결은
 * 이 단계의 범위가 아니고, 여기서는 OAuth 프로필을 JWT/session까지 옮기는
 * 경로만 만든다.
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

/**
 * users.auth_provider · users.provider_subject와 짝이 되는 식별값.
 * 지금은 session까지만 싣고 DB에는 쓰지 않는다.
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
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Kakao, Naver],
  session: { strategy: "jwt" },
  callbacks: {
    // account는 최초 로그인 때만 들어온다. 이후 호출에서는 token에 남은 값을 쓴다.
    jwt({ token, account }) {
      if (account) {
        token.authProvider = account.provider;
        token.providerSubject = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      session.authProvider = token.authProvider;
      session.providerSubject = token.providerSubject;
      return session;
    },
  },
});
