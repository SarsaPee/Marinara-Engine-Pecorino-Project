# Pecorino Project

This section covers the downstream Pecorino fork and the local workflow around it.

## Canonical Repo

The git-tracked source of truth is:

- `/Users/davidmigdale/Marinara-Engine-Pecorino-Project`

The historical loose install was parked as a backup:

- `/Users/davidmigdale/Marinara-Engine-loose-backup-2026-06-28`

The old live path now points to the repo checkout through a symlink:

- `/Users/davidmigdale/Marinara-Engine` -> `/Users/davidmigdale/Marinara-Engine-Pecorino-Project`

That means old scripts, habits, and references that still use `/Users/davidmigdale/Marinara-Engine` now land on the git repo instead of the loose copy.

## Day-To-Day Workflow

Make changes in the Pecorino repo checkout, then use normal git flow:

```bash
cd /Users/davidmigdale/Marinara-Engine-Pecorino-Project
git status
git add ...
git commit -m "..."
git push
```

## Remotes

- `origin`: `git@github.com:SarsaPee/Marinara-Engine-Pecorino-Project.git`
- `upstream`: `https://github.com/Pasta-Devs/Marinara-Engine.git`

## Updating From Upstream

Fetch upstream, then merge or rebase intentionally:

```bash
cd /Users/davidmigdale/Marinara-Engine-Pecorino-Project
git fetch upstream --tags
git merge upstream/main
```

If you want to track a specific upstream release instead:

```bash
git fetch upstream --tags
git merge v2.0.5
```

Resolve conflicts in the repo checkout, rebuild, then push the result to `origin`.

## Build Notes

The repo checkout was validated with:

```bash
corepack pnpm install --offline
corepack pnpm --filter @marinara-engine/shared build
corepack pnpm --filter @marinara-engine/server build
```

Current caveat:

- Node `v26` still prints the upstream engine warning because Marinara currently wants `>=24 <26`, but the build completed successfully.
