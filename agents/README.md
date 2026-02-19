# Agents

This folder holds prompts, context, and skills used by the GitHub Copilot Coding Agent (and other automation) when working on Turing Town.

## Structure

- **`context/`** – Game rules, design doc, and documentation the agent should follow.
- **`prompts/`** – Reusable prompt templates for feature work, bug fixes, and image tasks.
- **`skills/`** – Scripts and tools agents can run (e.g. image generation via Scenario AI).

## Secrets (GitHub / ENV)

Agents that call external APIs use **GitHub repository secrets** (or local env vars when run outside Actions):

| Secret / ENV              | Used by               | Purpose                                                                 |
|---------------------------|-----------------------|-------------------------------------------------------------------------|
| `COPILOT_ASSIGN_PAT`      | `agent-issues` workflow | Fine-grained PAT (Issues: R/W) from a **Copilot-licensed** user; used to assign ready issues to @copilot so the coding agent picks them up. |
| `MERGE_PAT`               | `auto-merge-copilot-prs` | (Optional) PAT from a **repo admin** who can bypass "Require review" on `main`. If branch protection blocks the default token, set this so Copilot PRs can be auto-merged. |
| `SCENARIO_API_KEY`        | `skills/images`, `npm run generate-images` | Scenario AI API key                                                     |
| `SCENARIO_API_SECRET`     | `skills/images`, `npm run generate-images` | Scenario AI API secret                                                  |
| `SCENARIO_MODEL_ID`       | `skills/images`       | (Optional) Default model ID                                             |
| `GITHUB_TOKEN`            | Actions               | Issue/PR comments, branch                                               |

Set these under **Settings → Secrets and variables → Actions** (or in your local environment).

### Copilot coding agent and Scenario (image generation)

For the **GitHub Copilot coding agent** to generate images (buildings, UI) via Scenario instead of placeholders, it must have `SCENARIO_API_KEY` and `SCENARIO_API_SECRET` in its environment. Configure them in the **`copilot` environment**:

1. **Settings → Environments** → create or open the **copilot** environment.
2. Add **Environment secrets**: `SCENARIO_API_KEY`, `SCENARIO_API_SECRET`.

See [Customize the agent environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment#setting-environment-variables-in-copilots-environment). The repo’s `.github/workflows/copilot-setup-steps.yml` installs dependencies so the agent can run `npm run generate-images`.

### Auto-merge and branch protection

With **Allow auto-merge** enabled (Settings → General → Pull Requests), the workflow **enables auto-merge** on Copilot PRs that fix an issue. GitHub then merges the PR when conditions are met (e.g. checks pass, required approval). You don’t need `MERGE_PAT` for this.

When a PR is merged, **On merged – close issue** runs and comments on the linked issue, adds `agent-done`, and closes the issue.

**Setup checklist:** See [.github/COPILOT-AUTO-MERGE-SETUP.md](../.github/COPILOT-AUTO-MERGE-SETUP.md) for the exact repo settings needed so Copilot PRs are merged when ready.
