# Git Workflow

## Branch

`main`은 항상 배포 가능한 branch다. 이슈 PR을 직접 받지 않고 `develop` → `main` 승격 PR과 hotfix만 받는다.

`develop`은 integration branch다. 이슈 branch의 기준점이자 PR target이며, 직접 개발하지 않는다.

적용 시점: 이 규칙(#65)이 `main`에 반영된 이후 새로 시작하는 Issue 작업부터 적용한다. 그 전에 만들어져 진행 중인 branch/PR에는 소급 적용하지 않는다.

작업 branch:

```text
feat/<issue>-<slug>
fix/<issue>-<slug>
hotfix/<issue>-<slug>
refactor/<issue>-<slug>
test/<issue>-<slug>
docs/<issue>-<slug>
chore/<issue>-<slug>
```

- slug는 짧은 kebab-case 영문을 사용한다.
- 하나의 branch는 하나의 Issue를 기본으로 한다.
- 새 branch는 최신 `develop`에서 만든다. `hotfix/*`만 `main`에서 만든다.
- 팀원의 branch를 임의로 force-push하지 않는다.
- 이슈 번호를 붙이는 규칙은 2026-09-11부터 적용한다. 그 전에 만든 branch(`docs/06-data-wbc`, `design-ysb` 등)는 예외로 두고 이름을 바꾸지 않는다.

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

## PR

- base branch: `develop` (hotfix · `develop` → `main` 승격 PR만 `main`). GitHub 기본 base가 `main`이므로 PR 생성 시 확인한다
- PR 제목: Conventional Commits
- body: `.github/PULL_REQUEST_TEMPLATE.md` 준수
- Issue 연결: 이슈 PR은 `Refs #<number>` (develop 대상 PR에서는 closing keyword가 이슈를 자동으로 닫지 않는다). 이슈는 승격 PR에서 `Closes #<number>`로 닫는다
- 변경이 크면 PR을 나눈다.
- merge: 이슈 PR · hotfix는 Squash merge, `develop` → `main` 승격과 `main` → `develop` 동기화는 merge commit

## 절대 하지 않을 것

- `main` · `develop` 직접 개발/직접 push
- force push to `main` · `develop`
- 승격 · 동기화 PR을 squash merge
- unrelated changes 포함
- merge conflict를 추측으로 해결
- 사용자의 명시적 요청 없는 merge/deploy
