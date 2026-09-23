"use server";

/**
 * 화면에서 부르는 로그인·로그아웃 server action.
 *
 * 인증 자체는 src/auth.ts 의 Auth.js 설정이 그대로 처리한다. 여기서는
 * client가 보낸 값을 검증하는 층만 더한다.
 * - 제공자: auth_accounts.auth_provider 가 받는 값으로 좁힌다.
 * - 복귀 경로: 같은 출처의 절대경로만 허용한다(열린 redirect 방지).
 *
 * 로그인 성공은 요청한 화면으로 복귀한다(docs/04-features.md F04).
 */
import { signIn, signOut } from "@/auth.ts";
import { toAuthProvider } from "@/server/auth-accounts.ts";

/** 요청 화면 복귀 경로. 값이 없거나 외부를 가리키면 홈으로 보낸다. */
function internalPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  // "//host" 와 "/\host" 는 브라우저가 외부 출처로 해석한다.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export async function startSocialLogin(formData: FormData): Promise<void> {
  const requested = formData.get("provider");
  const provider = typeof requested === "string" ? toAuthProvider(requested) : null;

  if (!provider) {
    // 값 자체를 오류에 담지 않는다. 지원하지 않는 제공자는 로그인시키지 않는다.
    throw new Error("Unsupported auth provider requested");
  }

  await signIn(provider, { redirectTo: internalPath(formData.get("redirectTo")) });
}

export async function endSession(formData: FormData): Promise<void> {
  await signOut({ redirectTo: internalPath(formData.get("redirectTo")) });
}
