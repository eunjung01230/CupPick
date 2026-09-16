# CLAUDE.md

## Project

이 프로젝트의 이름은 CupPick이다.

CupPick 프로젝트의 요구사항과 정책은 `/docs` 문서를 기준으로 한다.

CupPick은 1인 개발 프로젝트다. 팀 승인 절차는 두지 않되, 실수를 되돌릴 수 있게 하는 안전장치는 유지한다.

## Source of Truth

작업 전 다음 순서로 확인한다.

1. 현재 Git branch와 working tree 상태
2. 작업 대상과 범위 (Issue가 있으면 Issue)
3. `/docs`의 기획 문서
4. 관련 기존 코드와 테스트
5. `.claude/rules/`의 관련 규칙

`/docs`의 기획 문서는 다음과 같다.

- `docs/01-problem.md`
- `docs/02-workflow.md`
- `docs/03-requirements.md`
- `docs/04-features.md`
- `docs/05-policy.md`
- `docs/06-data.md`

문서에 없는 기능이나 정책을 임의로 추가하지 않는다.

문서끼리 내용이 충돌하거나 요구사항이 불명확한 경우
추측해서 구현하지 말고 사용자에게 확인한다.

문서와 코드가 어긋나면 임의로 한쪽에 맞추지 말고 차이를 먼저 보고한다.

## 규칙 파일 구성

- `.claude/rules/` — 세부 운영 규칙 (git-workflow · code-quality · scope-control · security · testing)
- `.claude/skills/` — 반복 작업 절차 (implement-feature · fix-bug · prepare-pr · review-pr · deploy-check · review-brief)
- `.claude/agents/` — 역할별 에이전트 (기획 인터뷰 · 문서 검토 · 문서 정합성 감사 · 화면 구현)

내용이 충돌하면 이 문서를 우선한다.

## Working Rules

1. 작업 전 현재 저장소 상태와 관련 코드를 먼저 확인한다.
2. 관련 문서를 읽고 작업 범위를 확정한다.
3. 필요한 범위만 최소한으로 수정한다.
4. 관련 없는 파일은 수정하지 않는다.
5. 기존 파일이나 코드를 임의로 삭제하지 않는다.
6. 문서에 정의되지 않은 기능을 임의로 확장하지 않는다.
7. 작업 완료 후 변경 파일과 검증 결과를 보고한다.

요청받지 않은 리팩터링, 파일 이동, 이름 일괄 변경, formatting 일괄 적용을 하지 않는다.
자세한 기준은 `.claude/rules/scope-control.md`를 따른다.

## Quality

- 기존 코드의 패턴을 먼저 확인하고 그것을 따른다.
- 새 추상화는 실제 중복이나 명확한 책임 분리가 있을 때만 만든다.
- error를 조용히 삼키지 않는다.
- 외부 응답과 사용자 입력은 신뢰하지 않는다.
- loading / empty / error / success 상태를 필요한 곳에서 구분한다.
- debug log, 임시 mock, 주석 처리한 코드를 남기지 않는다.

자세한 기준은 `.claude/rules/code-quality.md`를 따른다.

## Security

- secret, token, password, private key를 코드에 넣지 않는다.
- `.env` 계열 파일의 내용을 읽거나 출력하지 않는다.
- 클라이언트에 노출되면 안 되는 값을 frontend 번들에 넣지 않는다.
- 로그에 인증정보나 개인정보를 남기지 않는다.
- 인증과 인가를 구분한다. UI에서 버튼을 숨기는 것을 권한 검증으로 간주하지 않는다.

CupPick은 위치 정보, 소셜 로그인, 사용자 계정, 혜택 데이터를 다룬다.
이 영역을 건드리는 변경은 영향 범위를 먼저 설명한 뒤 진행한다.

자세한 기준은 `.claude/rules/security.md`를 따른다.

## Git Safety

사용자의 명시적인 요청 없이 다음 작업을 실행하지 않는다.

- `git push`
- Pull Request 생성 또는 수정
- merge
- force push
- branch 삭제
- `git reset --hard`
- `git clean`
- 기존 변경사항 삭제
- 임의 stash
- DB migration 실행
- production 배포
- 외부 서비스 설정 변경

Git 작업 전에는 가능하면 다음을 확인한다.

```bash
git status
git branch --show-current
git remote -v
```

branch와 commit 규칙은 `.claude/rules/git-workflow.md`를 따른다.

## Pull Request

PR은 선택 사항이다. 만드는 경우 `.claude/skills/prepare-pr/SKILL.md`의 절차를 따른다.

- base branch: `main`
- PR 제목은 Conventional Commits 형식을 사용한다.
- body는 `.github/PULL_REQUEST_TEMPLATE.md`를 따른다.

## Definition of Done

완료라고 보고하기 전에 확인한다.

- 작업 범위의 목표를 충족했다.
- 관련 없는 변경이 섞여 있지 않다.
- secret이나 debug 흔적이 남아 있지 않다.
- 프로젝트에 정의된 검증(lint / test / build)을 수행했다.
  아직 해당 명령이 없으면 "검증 대상 없음"을 그대로 보고한다.
- 수행하지 않은 검증을 수행했다고 적지 않는다.
- 변경한 파일, 확인한 방법, 남은 위험을 요약했다.
