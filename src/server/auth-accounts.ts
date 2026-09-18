/**
 * 소셜 로그인을 CupPick 내부 사용자(users.id)로 환원하는 경로.
 *
 * 서버 전용이다. db는 src/server/db/index.ts의 neon-http 클라이언트를 그대로
 * 재사용하고 여기서 새 연결을 만들지 않는다.
 *
 * 식별 기준은 (auth_provider, provider_subject) 하나다(06 §5.12 · POL02.2).
 * 이메일로 사용자를 찾지 않고 이메일이 같다는 이유로 계정을 합치지 않는다.
 * provider_email은 참고용으로만 저장한다. Google · Kakao · Naver는 같은 사람이
 * 같은 이메일로 로그인해도 각각 별개의 CupPick 계정이다.
 *
 * 한 사용자에게 auth_accounts 행을 더하는 경로(POL02.5 계정 연결)는 휴대폰
 * 본인인증이 전제라 아직 없다. 여기서는 로그인마다 계정 1개가 대응한다.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db/index.ts";
import { AUTH_PROVIDER, authAccounts } from "./db/schema.ts";

/** auth_accounts.auth_provider가 허용하는 값. */
export type AuthProvider = (typeof AUTH_PROVIDER)[number];

/** 한 번의 OAuth 로그인이 들고 오는 식별 정보. */
export type SocialIdentity = {
  provider: AuthProvider;
  /** OAuth의 providerAccountId. 제공자 안에서 사용자를 가리키는 불변 식별자다. */
  providerSubject: string;
  /** 제공자가 이메일을 주지 않으면 null. 식별에도 병합에도 쓰지 않는다. */
  providerEmail: string | null;
};

/** unique_violation. 동시 최초 로그인에서 uq_auth_accounts_provider_subject가 걸린다. */
const UNIQUE_VIOLATION = "23505";

/**
 * Auth.js provider id를 auth_provider 값으로 좁힌다.
 * 모르는 값은 null이다. chk_auth_accounts_provider가 어차피 막으므로
 * DB까지 보내지 않고 호출부에서 끊는다.
 */
export function toAuthProvider(providerId: string): AuthProvider | null {
  return AUTH_PROVIDER.find((provider) => provider === providerId) ?? null;
}

/**
 * DB 오류를 값 없이 다시 던지기 위한 오류.
 *
 * drizzle은 driver 오류를 DrizzleQueryError로 감싸고 그 message에 bind parameter를
 * 그대로 넣는다. 여기 parameter는 provider_subject와 provider_email이라 그대로
 * 올리면 Auth.js가 서버 로그에 개인정보를 남긴다. 값은 버리고 SQLSTATE만 남긴다.
 * 오류 자체를 삼키지는 않는다.
 */
class AuthAccountDbError extends Error {
  readonly sqlState: string | null;

  constructor(operation: string, cause: unknown) {
    const sqlState = postgresErrorCode(cause);
    super(`auth_accounts ${operation} failed${sqlState ? ` (postgres ${sqlState})` : ""}`);
    this.name = "AuthAccountDbError";
    this.sqlState = sqlState;
  }
}

/** 감싸인 오류 안쪽까지 내려가 PostgreSQL SQLSTATE를 찾는다. */
function postgresErrorCode(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    const { code } = current as Error & { code?: unknown };
    if (typeof code === "string") return code;
    current = current.cause;
  }

  return null;
}

/** (provider, subject)에 이미 연결된 CupPick 사용자를 찾는다. 없으면 null. */
async function findUserId(identity: SocialIdentity): Promise<string | null> {
  try {
    const rows = await db
      .select({ userId: authAccounts.userId })
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.authProvider, identity.provider),
          eq(authAccounts.providerSubject, identity.providerSubject),
        ),
      )
      .limit(1);

    return rows.at(0)?.userId ?? null;
  } catch (error) {
    throw new AuthAccountDbError("lookup", error);
  }
}

/**
 * users 1행과 auth_accounts 1행을 함께 만든다.
 *
 * neon-http driver는 interactive transaction을 지원하지 않는다(db.transaction()은
 * 호출 즉시 throw한다). 그래서 두 INSERT를 data-modifying CTE로 묶어 statement
 * 하나로 보낸다. PostgreSQL에서 statement 하나는 원자적이므로
 * uq_auth_accounts_provider_subject에 걸리면 CTE 안의 users INSERT까지 함께
 * 되돌아간다. ON CONFLICT로 넘기면 users만 남아 주인 없는 행이 되므로
 * 충돌은 오류로 받는다.
 *
 * users는 값을 주지 않는다. id · status · joined_at · created_at · updated_at은
 * schema.ts의 default가 정한다.
 */
async function createUserWithAuthAccount(identity: SocialIdentity): Promise<string> {
  /** 제공자가 빈 문자열을 주는 경우가 있다. 없는 것과 같게 둔다. */
  const providerEmail = identity.providerEmail?.trim() || null;

  let rows: { user_id: string }[];

  try {
    const result = await db.execute<{ user_id: string }>(sql`
      with created_user as (
        insert into users default values
        returning id
      )
      insert into auth_accounts (user_id, auth_provider, provider_subject, provider_email)
      select
        created_user.id,
        ${identity.provider}::text,
        ${identity.providerSubject}::text,
        ${providerEmail}::text
      from created_user
      returning user_id
    `);

    rows = result.rows;
  } catch (error) {
    throw new AuthAccountDbError("insert", error);
  }

  const userId = rows.at(0)?.user_id;

  if (!userId) {
    throw new Error("auth_accounts insert returned no user_id.");
  }

  return userId;
}

/**
 * 로그인한 소셜 계정에 대응하는 CupPick users.id를 돌려준다.
 * 처음 보는 (provider, subject)면 계정을 새로 만든다.
 *
 * 실패는 그대로 던진다. 호출부는 내부 id 없이 로그인을 진행하면 안 된다.
 */
export async function resolveUserId(identity: SocialIdentity): Promise<string> {
  if (!identity.providerSubject) {
    throw new Error(`Empty providerAccountId from provider "${identity.provider}".`);
  }

  const existing = await findUserId(identity);

  if (existing !== null) return existing;

  try {
    return await createUserWithAuthAccount(identity);
  } catch (error) {
    if (!(error instanceof AuthAccountDbError) || error.sqlState !== UNIQUE_VIOLATION) {
      throw error;
    }

    // 같은 계정으로 동시에 처음 로그인했다. 이쪽 INSERT는 통째로 되돌아갔으므로
    // 주인 없는 users는 남지 않는다. 먼저 끝난 쪽이 만든 행을 다시 읽어 쓴다.
    const settled = await findUserId(identity);

    if (settled !== null) return settled;

    // 충돌은 났는데 그 행이 안 보인다. 알 수 없는 상태이므로 로그인시키지 않는다.
    throw error;
  }
}
