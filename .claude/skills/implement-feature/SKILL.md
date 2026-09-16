---
name: implement-feature
description: GitHub Issue 단위의 새 기능을 기존 구조를 존중해 최소 범위로 구현할 때 사용한다.
---

# Implement Feature

1. 현재 branch와 working tree를 확인한다.
2. Issue의 목적, scope, acceptance criteria를 정리한다.
3. 관련 코드를 탐색해 기존 구현 패턴과 데이터 흐름을 파악한다.
4. 변경 파일과 접근 방식을 짧게 계획한다.
5. scope 밖 변경 없이 최소 구현한다.
6. loading / empty / error / success 상태를 필요한 만큼 처리한다.
7. 기존 테스트 패턴을 따라 검증을 추가한다.
8. `docs/PROJECT_COMMANDS.md`에 정의된 가능한 검증을 수행한다.
9. diff를 다시 읽고 unrelated change, debug artifact, secret을 제거한다.
10. 결과를 다음 형식으로 보고한다.

- 구현:
- 변경 파일:
- 검증:
- 미검증/위험:
- 후속 Issue 후보:
