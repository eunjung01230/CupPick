# Scope Control

Claude가 작업하면서 "같이 고치면 좋아 보이는 것"을 발견해도 자동으로 범위를 넓히지 않는다.

현재 Issue와 무관하면:
1. 문제를 짧게 기록한다.
2. 현재 작업에는 포함하지 않는다.
3. 필요하면 별도 Issue 후보로 제안한다.

다음 변경은 명시적 근거 없이 하지 않는다.

- folder 구조 전면 변경
- framework/library 교체
- package manager 변경
- dependency 대량 업데이트
- formatter 전체 적용
- naming convention 일괄 변경
- API contract 변경
- DB migration/schema 변경
- auth 정책 변경
- CI/CD 또는 deployment target 변경
