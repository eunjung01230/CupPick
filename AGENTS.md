# AGENTS.md

## Project

프로젝트 이름은 CupPick이다. 1인 개발 프로젝트다.

프로젝트 요구사항과 정책의 Source of Truth는 `/docs`이다.

## Documentation

작업 전 다음 순서로 확인한다.

1. 현재 Git branch와 working tree 상태
2. 작업 대상과 범위
3. `/docs`의 기획 문서
4. 관련 기존 코드
5. `.claude/rules/`의 관련 규칙

기획 문서는 다음과 같다.

- `docs/01-problem.md`
- `docs/02-workflow.md`
- `docs/03-requirements.md`
- `docs/04-features.md`
- `docs/05-policy.md`
- `docs/06-data.md`

문서에 없는 기능이나 정책은 임의로 추가하지 않는다.

문서 간 충돌이나 불명확한 내용이 있으면 추측하지 말고 사용자에게 확인한다.

문서와 코드가 어긋나면 임의로 한쪽에 맞추지 말고 차이를 먼저 보고한다.

## 규칙 파일 구성

- `.claude/rules/` — 세부 운영 규칙
- `.claude/skills/` — 반복 작업 절차
- `.claude/agents/` — 역할별 에이전트

내용이 충돌하면 `CLAUDE.md`를 우선한다.

## Development Rules

- 기존 구조와 코드를 먼저 확인하고 그 패턴을 따른다.
- 필요한 범위만 수정한다.
- 관련 없는 파일은 변경하지 않는다.
- 기존 파일이나 코드를 임의로 삭제하지 않는다.
- 요구사항을 임의로 확장하지 않는다.
- 요청받지 않은 리팩터링이나 formatting 일괄 적용을 하지 않는다.
- error를 조용히 삼키지 않는다. 외부 응답과 사용자 입력은 신뢰하지 않는다.
- 구현 후 검증 결과를 확인한다.
- 작업 완료 시 변경한 파일과 작업 내용을 보고한다.

## Security

- secret, token, private key를 코드에 넣지 않는다.
- `.env` 계열 파일의 내용을 읽거나 출력하지 않는다.
- 로그에 인증정보나 개인정보를 남기지 않는다.
- 인증과 인가를 구분한다.

CupPick은 위치 정보, 소셜 로그인, 사용자 계정, 혜택 데이터를 다룬다.
이 영역을 건드리는 변경은 영향 범위를 먼저 설명한 뒤 진행한다.

## Git Safety

사용자의 명시적인 요청 없이 push, PR 생성/수정, merge, force push, branch 삭제,
`git reset --hard`, `git clean`, DB migration 실행, production 배포,
외부 서비스 설정 변경을 실행하지 않는다.

작업 전 가능하면 다음을 확인한다.

```bash
git status
git branch --show-current
git remote -v
```

branch와 commit 규칙은 `.claude/rules/git-workflow.md`,
PR 절차는 `.claude/skills/prepare-pr/SKILL.md`를 따른다.

## 완료 기준

- 작업 범위의 목표를 충족했다.
- 관련 없는 변경이 섞여 있지 않다.
- secret이나 debug 흔적이 없다.
- 프로젝트에 정의된 검증을 수행했다. 해당 명령이 없으면 "검증 대상 없음"으로 보고한다.
- 수행하지 않은 검증을 수행했다고 적지 않는다.
