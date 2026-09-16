# AGENTS.md

## Project

프로젝트 이름은 CupPick이다.

프로젝트 요구사항과 정책의 Source of Truth는 `/docs`이다.

## Documentation

작업 전 관련 문서를 반드시 확인한다.

- `docs/01-problem.md`
- `docs/02-workflow.md`
- `docs/03-requirements.md`
- `docs/04-features.md`
- `docs/05-policy.md`
- `docs/06-data.md`

문서에 없는 기능이나 정책은 임의로 추가하지 않는다.

문서 간 충돌이나 불명확한 내용이 있으면 추측하지 말고 사용자에게 확인한다.

## Development Rules

- 기존 구조와 코드를 먼저 확인한다.
- 필요한 범위만 수정한다.
- 관련 없는 파일은 변경하지 않는다.
- 기존 파일이나 코드를 임의로 삭제하지 않는다.
- 요구사항을 임의로 확장하지 않는다.
- 구현 후 검증 결과를 확인한다.
- 작업 완료 시 변경한 파일과 작업 내용을 보고한다.

## Git Safety

작업 전 가능하면 다음을 확인한다.

```bash
git status
git branch --show-current
git remote -v