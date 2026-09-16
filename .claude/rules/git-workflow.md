# Git Workflow

CupPick은 1인 개발 프로젝트다. 팀 리뷰·승인 절차는 두지 않되, 실수를 되돌릴 수 있게 하는 안전장치는 유지한다.

## Branch

`main`은 유일한 기준 branch이며 항상 배포 가능한 상태를 유지한다.

작업 branch:

```text
feat/<slug>
fix/<slug>
refactor/<slug>
test/<slug>
docs/<slug>
chore/<slug>
```

- slug는 짧은 kebab-case 영문을 사용한다.
- Issue를 만들어 작업하는 경우 `feat/12-benefit-card`처럼 이슈 번호를 앞에 붙인다. Issue 없이 작업해도 된다.
- 하나의 branch는 하나의 작업 단위를 다룬다.
- 새 branch는 최신 `main`에서 만든다.
- 작업이 끝난 branch는 `main`에 반영한 뒤 정리한다. branch 삭제는 사용자 요청이 있을 때만 실행한다.
- 소규모 문서·설정 변경은 사용자가 명시적으로 요청한 경우 `main`에 직접 커밋할 수 있다. 그 외에는 작업 branch를 사용한다.

## Commit

Conventional Commits:

```text
feat:
fix:
refactor:
perf:
test:
docs:
style:
build:
ci:
chore:
```

제목은 "무엇을 했는가"가 드러나도록 작성한다.

하나의 commit은 하나의 목적만 담는다. 관련 없는 변경을 함께 커밋하지 않는다.

## Pull Request

PR은 선택 사항이다. 변경이 크거나 나중에 근거를 다시 찾을 것 같으면 자기 리뷰용으로 PR을 만든다.

- base branch: `main`
- PR 제목: Conventional Commits
- body: `.github/PULL_REQUEST_TEMPLATE.md` 준수
- Issue 연결: `Closes #<number>`
- 절차는 `.claude/skills/prepare-pr/SKILL.md`를 따른다.

## 절대 하지 않을 것

- force push
- `git reset --hard`로 커밋하지 않은 변경 삭제
- destructive `git clean`
- 원격에 이미 push된 커밋 이력 변조
- merge conflict를 추측으로 해결
- unrelated changes를 한 커밋에 섞기

## 사용자 승인이 필요한 작업

아래는 사용자가 명시적으로 요청하기 전에 실행하지 않는다.

- `git push`
- PR 생성 또는 수정
- merge
- branch 삭제
- `git reset --hard` · `git clean`
- 임의 stash
- DB migration 실행
- production 배포
- 외부 서비스 설정 변경

Git 작업 전에는 다음을 확인한다.

```bash
git status
git branch --show-current
git remote -v
```
