---
name: review-pr
description: PR diff를 요구사항, 회귀, 타입, 에러 처리, 보안, 테스트 관점에서 검토할 때 사용한다.
---

# Review PR

리뷰는 코드 스타일 취향보다 defect risk를 우선한다.

우선순위:
1. 요구사항 불충족
2. 기능 regression
3. 보안/권한
4. 데이터 손실/잘못된 상태
5. race condition / async 오류
6. error handling
7. 타입 불일치
8. 테스트 누락
9. 유지보수성

각 finding은:
- Severity: blocker / major / minor
- 위치
- 문제
- 왜 문제인지
- 최소 수정 제안

문제가 없으면 억지 finding을 만들지 않는다.
마지막에 "merge 가능 / 수정 후 가능 / 현재 merge 비권장" 중 하나로 결론낸다.
