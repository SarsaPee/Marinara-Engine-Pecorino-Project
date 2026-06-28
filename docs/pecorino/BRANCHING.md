# Pecorino Branching Policy

This is the recommended git workflow for the Pecorino fork.

The goal is to keep Pecorino stable as a downstream product while still making it practical to:

- sync changes from Marinara upstream
- keep the local runnable branch sane
- upstream selected fixes or features later without dragging the whole fork into a PR

## Core Principle

Use upstream `main` or tagged releases as the normal downstream sync source.

Use upstream `staging` only when preparing a contribution back to Marinara.

That means Pecorino does **not** live on top of `staging` day to day.

## Branch Roles

### `main`

This is Pecorino's stable and runnable branch.

Use it for:

- the current local install
- container builds
- tested downstream behavior
- release tags

Do not build new work directly on `main` if you can avoid it.

### `feature/<name>`

Use feature branches for normal Pecorino development.

Examples:

- `feature/agent-stack-ui`
- `feature/lorebook-writeback-guard`
- `feature/preset-import-bundle`

These branch from `main` and merge back into `main` after testing.

### `sync/upstream-main-<date>`

Use a temporary sync branch when pulling changes from Marinara upstream `main`.

Examples:

- `sync/upstream-main-2026-06-28`
- `sync/upstream-main-v2.0.6`

This gives upstream merges a sandbox instead of dropping them straight onto Pecorino `main`.

### `pr/upstream-<name>`

Use a clean branch based on `upstream/staging` when preparing a contribution back to Marinara.

Examples:

- `pr/upstream-knowledge-router-fix`
- `pr/upstream-agent-ordering-ui`

These branches should contain only the smallest clean change you want to propose upstream.

Do not open upstream PRs from Pecorino `main`.

## Normal Pecorino Development

For downstream work:

```bash
git checkout main
git pull
git checkout -b feature/<name>
```

Then after testing:

```bash
git checkout main
git merge feature/<name>
git push
```

## Syncing From Upstream

Do not merge upstream directly into `main` blind.

Instead:

```bash
git fetch upstream --tags
git checkout main
git checkout -b sync/upstream-main-<date>
git merge upstream/main
```

Then:

- resolve conflicts
- build
- smoke test
- merge the sync branch back into `main`

This keeps upstream integration contained and reversible.

## Preparing Upstream Contributions

If you want to contribute something back to Marinara:

```bash
git fetch upstream
git checkout -b pr/upstream-<name> upstream/staging
```

Then manually port the relevant fix or feature into that branch.

This is intentionally separate from the Pecorino downstream branch so the PR stays understandable and reviewable.

## What Not To Do

- Do not treat `upstream/staging` as Pecorino's daily base unless you explicitly want constant integration churn.
- Do not develop large downstream changes directly on `main`.
- Do not open upstream PRs from your downstream `main`.
- Do not combine "sync from upstream" and "new downstream feature" in the same branch when you can avoid it.

## Recommended Tagging

Tag tested Pecorino states from `main`.

Examples:

- `pecorino-v2.0.5.1`
- `pecorino-v2.0.5.2`

This makes rollback, container pinning, and release notes much easier.
