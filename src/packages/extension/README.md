# gitpilot

AI-powered git workflow inside VS Code. Generate commit messages, create
pull requests with AI descriptions, and run AI code reviews — all from a
task-oriented sidebar.

The extension shells out to the [`gitpilot`](https://www.npmjs.com/package/gitpilot)
CLI for every action, so the same flow runs identically in the terminal
and inside VS Code.

## Features

### Commit flow

- **Generate Commit Message** — runs `gitpilot commit --dry-run` and
  drops the suggested Conventional Commit message into an editable
  textarea.
- Edit freely, then click **Commit** to run `git commit -m "<edited>"`.
  The extension never auto-commits the AI draft.

### Pull Request flow

When the current branch has at least one commit but no open PR, the
sidebar shows the PR panel:

- Branch name and push state pulled from `gitpilot status --json`.
- **Generate PR title + description** — runs
  `gitpilot pr create --dry-run` and fills two editable fields.
- **Create PR** — pushes the branch and opens the PR (uses `gh`).

### Code Review

When the current branch has an open PR, the sidebar swaps the PR panel
for a review panel:

- **Generate Code Review** — runs `gitpilot review --json`.
- Each issue is rendered with severity (blocker / warning / info), file
  + line, comment text, and the optional suggested fix. No empty-state
  card is rendered when there are zero issues.

### Mode toggle

Switch the sidebar between **Gitpilot (AI)** and **Native Git** at any
time. In Native Git the AI generation buttons are hidden and you fill
the commit message / PR title manually before submitting. The mode is
persisted across sessions.

### Model switcher

Pick the active provider + model from a dropdown. Supports:

- Claude (Sonnet 4.6, Opus 4.7)
- GPT-4o
- Gemini 2.5 Pro / 2.0 Flash
- Any local Ollama model auto-discovered at
  `http://localhost:11434/api/tags`

The selection is written into `gitpilot.config.yml`.

### API key management

- **Manage API Keys** opens a quick-pick that writes secrets to the OS
  keychain via `keytar` (no `.env` files, no plaintext).
- A first-launch prompt asks for at least one AI key and one platform
  token before the panel becomes interactive.

## Commands

| Command                                       | What it does                                            |
| --------------------------------------------- | ------------------------------------------------------- |
| `gitpilot: Generate commit message`           | Runs `gitpilot commit` in a terminal                    |
| `gitpilot: Create PR with description`        | Runs `gitpilot pr` in a terminal                        |
| `gitpilot: Review current PR`                 | Prompts for PR id then runs `gitpilot review`           |
| `gitpilot: Fix all blocker comments`          | Runs `gitpilot fix --all`                               |
| `gitpilot: Fix selected comment`              | Runs `gitpilot fix --pr <id> --comment <id>`            |
| `gitpilot: Switch AI model`                   | Quick-pick that updates `gitpilot.config.yml`           |
| `gitpilot: Setup or update API keys`          | Opens the keychain manager                              |
| `gitpilot: Show panel`                        | Focuses the sidebar                                     |
| `gitpilot: Show status`                       | Runs `gitpilot status` in a terminal                    |
| `gitpilot: Toggle between AI and Native Git`  | Flips the sidebar mode                                  |

## Settings

| Setting                | Default          | Description                                     |
| ---------------------- | ---------------- | ----------------------------------------------- |
| `gitpilot.defaultMode` | `gitpilot`       | `"gitpilot"` (AI) or `"native"` (manual)        |
| `gitpilot.cliCommand`  | `npx gitpilot`   | Override if `gitpilot` is installed differently |

## Requirements

- **Node.js** 24+
- **VS Code** 1.85+
- A git repository in the workspace
- `gh` CLI on `PATH` if you plan to create PRs from the panel
- API keys for whichever AI provider you select (skip if using Ollama)

## Configuration file

The extension expects a `gitpilot.config.yml` at the workspace root.
Minimal example:

```yaml
ai:
  provider: claude
  model: claude-sonnet-4-6
platform:
  type: github
  owner: your-org
  repo: your-repo
mode:
  commit: interactive
  pr_create: interactive
  pr_description: auto
  pr_review: auto
  comment_fix: interactive
review:
  rules:
    - id: no-console-logs
      description: No console.log in production code
      severity: warning
    - id: no-hardcoded-secrets
      description: No hardcoded API keys or tokens
      severity: blocker
```

## How it works

The extension host **never** imports CLI modules directly. Every action
either:

1. **Captures stdout** from a one-shot `npx gitpilot … --dry-run` /
   `--json` invocation when the sidebar needs structured data, or
2. **Spawns a terminal** when the user should see streaming output or
   answer prompts (palette commands, fix flows, `gh pr create`).

Mode and first-launch state live in `context.globalState`. Secrets live
in the OS keychain. Model selection lives in `gitpilot.config.yml`.

## License

MIT
