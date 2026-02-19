# Auto-merge Copilot PRs – setup

These workflows let Copilot PRs go from draft → ready → merged with no manual "Ready for review" or "Merge" clicks.

## 1. Turn on "Allow auto-merge"

- Repo **Settings** → **General** → scroll to **Pull Requests**
- Enable **"Allow auto-merge"**

Without this, GitHub will not merge PRs automatically even when the workflow enables auto-merge on them.

## 2. Branch protection (optional)

- **Settings** → **Branches** → branch protection rule for `main`

If you **do not** require "Pull request reviews before merging", the default setup is enough: when a Copilot PR is ready and checks pass, GitHub will merge it (squash).

If you **do** require reviews (e.g. 1 approval), PRs will only merge after that approval. To have Copilot PRs merge with no human approval, either:

- Remove the "Require a pull request before merging" / "Require approvals" requirement for `main`, or  
- Rely on the workflow only to **enable** auto-merge and approve/merge manually when you want.

## Flow

1. Copilot opens a **draft** PR.
2. **Mark Copilot PRs ready** runs → marks the PR as **Ready for review** (GraphQL `markPullRequestReadyForReview`).
3. **Enable auto-merge for Copilot PRs** runs (on `ready_for_review`) → enables **auto-merge** with **squash**.
4. When required checks pass (and any required reviews), GitHub **merges** the PR automatically.

## What the workflows do

| Workflow | What it does |
|----------|----------------|
| **Mark Copilot PRs ready** (`copilot-ready.yml`) | When a **draft** PR **created by Copilot** is opened, reopened, or updated, marks it **ready for review**. |
| **Enable auto-merge for Copilot PRs** (`copilot-auto-merge.yml`) | When a **non-draft** PR **created by Copilot** is ready (e.g. after the above step), **enables GitHub auto-merge** (squash). GitHub then merges when required checks pass. |
| **On merged – close issue** | When a PR is merged, comments on the linked issue, adds the `agent-done` label, and closes the issue. |

No extra secrets are required; both use `GITHUB_TOKEN`.
