# CLAUDE.md

## Project

이 프로젝트의 이름은 CupPick이다.

CupPick 프로젝트의 요구사항과 정책은 `/docs` 문서를 기준으로 한다.

## Source of Truth

구현 전에 반드시 관련 문서를 먼저 확인한다.

- `docs/01-problem.md`
- `docs/02-workflow.md`
- `docs/03-requirements.md`
- `docs/04-features.md`
- `docs/05-policy.md`
- `docs/06-data.md`

문서에 없는 기능이나 정책을 임의로 추가하지 않는다.

문서끼리 내용이 충돌하거나 요구사항이 불명확한 경우
추측해서 구현하지 말고 사용자에게 확인한다.

## Working Rules

1. 작업 전 현재 저장소 상태와 관련 코드를 먼저 확인한다.
2. 관련 문서를 읽고 작업 범위를 확정한다.
3. 필요한 범위만 최소한으로 수정한다.
4. 관련 없는 파일은 수정하지 않는다.
5. 기존 파일이나 코드를 임의로 삭제하지 않는다.
6. 문서에 정의되지 않은 기능을 임의로 확장하지 않는다.
7. 작업 완료 후 변경 파일과 검증 결과를 보고한다.

## Git Safety

사용자의 명시적인 요청 없이 다음 작업을 실행하지 않는다.

- `git push`
- Pull Request 생성 또는 수정
- branch 삭제
- force push
- `git reset --hard`
- 기존 변경사항 삭제
- 임의 stash

Git 작업 전에는 가능하면 다음을 확인한다.

```bash
git status
git branch --show-current
git remote -v