-- Custom SQL migration file, put your code below! --

-- users.auth_provider / provider_subject 를 auth_accounts 로 옮긴다.
-- 0002가 auth_accounts를 만들고 0004가 users의 원본 컬럼을 지운다.
-- 이 파일은 그 사이에서만 의미가 있다. 순서가 바뀌면 인증 식별값이 사라진다.
--
-- users가 비어 있으면 한 행도 만들지 않고 그대로 통과한다. 데이터 유무를
-- 추측하지 않고 어느 쪽이든 안전하게 동작하도록 두었다.
-- ON CONFLICT DO NOTHING이라 재실행해도 중복이 생기지 않는다. 원본에
-- UNIQUE(auth_provider, provider_subject)가 있었으므로 users 안에서는 충돌이 없다.
-- created_at/updated_at에는 가입 시각을 옮긴다. 이 로그인 수단은 가입 시점부터
-- 있었으므로 이관 시각으로 덮어쓰지 않는다.
-- provider_email은 users에 없던 값이라 NULL로 둔다. 나중에 이메일로 계정을
-- 찾거나 합치지 않는다(05 POL02.2).
INSERT INTO "auth_accounts" ("user_id", "auth_provider", "provider_subject", "created_at", "updated_at")
SELECT "id", "auth_provider", "provider_subject", "joined_at", "joined_at"
FROM "users"
ON CONFLICT ("auth_provider", "provider_subject") DO NOTHING;--> statement-breakpoint

-- 이관 누락 검사. 0004가 컬럼을 지우기 전에 실패해야 복구할 수 있다.
-- drizzle-kit migrate는 migration을 트랜잭션으로 실행하므로 여기서 예외가 나면
-- 위 INSERT까지 함께 되돌아가고 0004는 실행되지 않는다.
DO $$
DECLARE
  missing bigint;
BEGIN
  SELECT count(*) INTO missing
  FROM "users" u
  WHERE NOT EXISTS (
    SELECT 1 FROM "auth_accounts" a WHERE a."user_id" = u."id"
  );
  IF missing > 0 THEN
    RAISE EXCEPTION 'auth_accounts 이관 누락: 로그인 수단 없는 users % 행', missing;
  END IF;
END $$;
