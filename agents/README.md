# Agents

This folder holds prompts, context, and skills used by the GitHub Copilot Coding Agent (and other automation) when working on Turing Town.

## Structure

- **`context/`** – Game rules, design doc, and documentation the agent should follow.
- **`prompts/`** – Reusable prompt templates for feature work, bug fixes, and image tasks.
- **`skills/`** – Scripts and tools agents can run (e.g. image generation via Scenario AI).

## Secrets (GitHub / ENV)

Agents that call external APIs use **GitHub repository secrets** (or local env vars when run outside Actions):

| Secret / ENV              | Used by        | Purpose                    |
|---------------------------|----------------|----------------------------|
| `SCENARIO_API_KEY`        | `skills/images`| Scenario AI API key        |
| `SCENARIO_API_SECRET`     | `skills/images`| Scenario AI API secret     |
| `SCENARIO_MODEL_ID`       | `skills/images`| (Optional) Default model ID |
| `GITHUB_TOKEN`            | Actions        | Issue/PR comments, branch  |

Set these under **Settings → Secrets and variables → Actions** (or in your local environment).
