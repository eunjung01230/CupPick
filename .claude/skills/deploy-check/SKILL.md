---
name: deploy-check
description: 배포 직전 main의 릴리즈 위험과 필수 검증을 확인할 때 사용한다.
disable-model-invocation: true
---

# Deploy Check

배포를 직접 실행하는 skill이 아니다. 배포 가능 여부를 점검한다.

1. working tree와 현재 commit 확인
2. 배포 대상 branch/commit 명시
3. 최근 merge된 변경 확인
4. 프로젝트의 lint/typecheck/test/build 실행
5. env 변경 여부 확인 (값은 읽지 않는다)
6. DB migration/schema 변경 여부 확인
7. dependency/lockfile 변경 확인
8. 핵심 사용자 흐름 smoke test 항목 작성
9. known issue 확인
10. rollback 가능한 상태인지 확인

결과:

- Target:
- Checks passed:
- Checks failed:
- Manual smoke tests:
- Migration/env notes:
- Known risks:
- Recommendation: GO / GO WITH CAUTION / NO-GO

사용자가 명시적으로 요청하기 전에는 production deploy를 실행하지 않는다.
