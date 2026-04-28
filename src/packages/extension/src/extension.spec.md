# Module: vscode-extension

## Purpose

Expose all gitpilot commands inside VS Code via the command palette,
sidebar panel, and source control context menus. Developers never need
to open a terminal — everything works from inside VS Code.

## Two parts

1. extension host (packages/extension/src/extension.ts)
   Pure TypeScript, talks to VS Code API, calls CLI via child_process
2. webview panel (packages/webview/src/)
   React + Vite, compiled to single HTML file, shows pipeline status
   and review comments visually

## Commands registered (command palette via Cmd+Shift+P)

| Command ID              | Label                                       |
| ----------------------- | ------------------------------------------- |
| gitpilot.commit         | gitpilot: Generate commit message           |
| gitpilot.createPR       | gitpilot: Create PR with description        |
| gitpilot.reviewPR       | gitpilot: Review current PR                 |
| gitpilot.fixAllBlockers | gitpilot: Fix all blocker comments          |
| gitpilot.fixComment     | gitpilot: Fix selected comment              |
| gitpilot.switchModel    | gitpilot: Switch AI model                   |
| gitpilot.auth           | gitpilot: Setup or update API keys          |
| gitpilot.showPanel      | gitpilot: Show panel                        |
| gitpilot.status         | gitpilot: Show status                       |
| gitpilot.toggleMode     | gitpilot: Toggle between AI and Native Git  |

## Sidebar panel

Registers a WebviewViewProvider in the VS Code sidebar showing a
task-oriented UI (no pipeline state machine) with these sections:

### Manage Keys

- Shows current AI provider and whether the corresponding key is set.
- Shows whether the platform token is configured.
- "Manage API Keys" button → invokes the same flow as the
  `gitpilot.auth` command.

### Mode toggle

- "gitpilot (AI)" / "Native Git" button group.
- Persisted to `context.globalState` under `gitpilot.mode`.
- In Native Git mode the AI generation buttons are hidden; the user
  edits the commit message / PR title manually before submitting.

### Commit

- "Generate Commit Message" button → runs `gitpilot commit --dry-run`,
  parses JSON `{message}`, fills the editable textarea.
- Editable textarea, pre-filled with the generated message.
- "Commit" button → runs `git commit -m "<edited>"` directly. Never
  auto-commits the generated draft without the user pressing Commit.

### Pull Request

Visible when the repo has at least one commit but no open PR. Surfaces:

- Branch name + push state from `gitpilot status --json`.
- "Generate PR title + description" → runs
  `gitpilot pr create --dry-run`, fills editable fields.
- Editable title input + description textarea.
- "Create PR" → uses `gh pr create` to push the branch and open the PR.

### Code Review

Visible when the current branch has an open PR. Shows:

- "Generate Code Review" button → runs `gitpilot review --json`.
- The returned issues rendered as a list with severity, file:line, and
  optional suggested fix. No empty-state card is rendered when there
  are zero issues.

### Model switcher section

Dropdown showing the current provider + model. Built-in options:

- Claude Sonnet 4.6 (default, recommended)
- Claude Opus 4.7
- GPT-4o
- Gemini 2.5 Pro
- Gemini 2.0 Flash

Plus any models reported by a local Ollama daemon at
`http://localhost:11434/api/tags`, deduped against the static list.

Changing selection writes `ai.provider` and `ai.model` directly to
`gitpilot.config.yml` via `js-yaml` (no CLI roundtrip), then notifies
the webview with a `configUpdate` message.

## Extension host implementation

### Two CLI invocation paths

The host calls the CLI in two different ways depending on whether the
sidebar needs the data inline or wants the user to follow an interactive
flow:

1. **Captured stdout** (`execGitpilot(args)` → `child_process.execFile`)
   used by `gitpilot commit --dry-run`, `gitpilot pr create --dry-run`,
   `gitpilot review --json`, and `gitpilot status --json`. Output is
   parsed as JSON and forwarded to the webview as a typed message.
2. **Terminal** (`vscode.window.createTerminal({ name: "gitpilot" })`)
   used by the palette commands so the user can answer interactive
   prompts. The same terminal is reused for the `gh pr create` flow.

### Mode handling

`globalState[gitpilot.mode]` holds either `"gitpilot"` or `"native"`
(default `"gitpilot"`). When mode is `native` the sidebar's Generate
buttons short-circuit — no AI call is made and the user fills the
textarea manually before pressing Commit / Create PR. The
`gitpilot.toggleMode` palette command flips the value and posts
`modeUpdate` so the sidebar reflects the change immediately.

### Webview ↔ host message protocol

Inbound (host → webview): `setupStatus`, `configUpdate`,
`modelOptionsUpdate`, `commandRunning` / `commandDone` /
`commandFailed`, `commitDraft`, `prDraft`, `reviewResult`,
`repoStatus`, `modeUpdate`.

Outbound (webview → host): `requestState`, `setupKeys`, `switchModel`,
`generateCommit`, `commitMessage`, `generatePr`, `createPr`,
`runReview`, `setMode`, `refreshStatus`.

All payloads are validated with zod at both ends.

### Status bar item

Shows at the bottom of VS Code:

- "$(sync~spin) gitpilot running..." during command execution
- "$(check) gitpilot ready" when idle
- "$(alert) 3 blockers" when review found issues
- Clicking opens the sidebar panel

## Webview React component structure

packages/webview/src/
App.tsx ← root, receives messages from extension
components/
ManageKeys.tsx ← key status + Manage button
ModeToggle.tsx ← gitpilot / Native Git switch
CommitPanel.tsx ← Generate / edit / commit
PrPanel.tsx ← Generate / edit / create PR
ReviewPanel.tsx ← Generate Code Review + issue list
ModelSwitcher.tsx ← dropdown for AI model selection
SeverityBadge.tsx ← severity pill used in ReviewPanel

## package.json for extension

The shipped manifest declares:

- `name`: `gitpilot`, `displayName`: `gitpilot`, `publisher`: `atsharma`.
- `categories`: `["SCM Providers", "AI", "Other"]`.
- `activationEvents`: `["onStartupFinished"]`.
- `keywords`: git, ai, commit, pull request, code review, claude, openai,
  gemini, ollama, conventional commits.
- `contributes.commands`: every command listed above is registered as a
  `gitpilot.*` command with `category: "gitpilot"`.
- `contributes.viewsContainers.activitybar`: a single `gitpilot` container
  using `media/activity-bar.png`.
- `contributes.views.gitpilot`: one webview view `gitpilot.panel` titled
  "gitpilot".
- `contributes.menus.scm/title`: surfaces `gitpilot.commit` from the
  Source Control title bar when the active provider is git.
- `contributes.menus.view/title`: surfaces `gitpilot.toggleMode` and
  `gitpilot.auth` in the gitpilot panel header.
- `contributes.configuration`:
  - `gitpilot.defaultMode`: `"gitpilot" | "native"` (default `gitpilot`).
  - `gitpilot.cliCommand`: command used to invoke the CLI (default
    `npx gitpilot`).

## API key management

Inside VS Code the user never runs `gitpilot auth`. The extension owns the
secret-setup UX:

- On first activation per VS Code profile, the extension prompts the user
  to set up API keys. A `gitpilot.firstLaunchComplete` flag in
  `context.globalState` ensures this runs once.
- The `gitpilot.auth` command opens the same flow and can be re-run any
  time to set, update, or clear keys.
- Keys are written to the OS keychain via `keytar` under the service name
  `gitpilot`, using the same account names (`ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, `AZURE_DEVOPS_PAT`,
  `GITLAB_TOKEN`) that `core/secrets` reads. CLI subprocesses spawned
  from the extension's terminal therefore see the keys without any
  additional config.
- Prompts use `vscode.window.showInputBox({ password: true })` so values
  never appear in the terminal or output channels.

## Rules

- Extension host never imports CLI modules directly — always spawns process
- Webview built separately with Vite, loaded as compiled HTML
- Extension activates on startup (onStartupFinished)
- All commands available in command palette
- Status bar always visible when extension active
- Model switcher reads current model from gitpilot.config.yml on open
- Fix button in webview passes exact commentId to CLI
- API keys are configured inside VS Code (first-launch prompt or
  `gitpilot.auth`), never by asking the user to run `gitpilot auth` in a
  terminal

## Tests required

- Palette commands spawn a terminal with the correct CLI invocation.
- `gitpilot.toggleMode` flips `globalState[gitpilot.mode]` between
  `gitpilot` and `native` and posts `modeUpdate` to the webview.
- `switchModel` quick pick shows every option in `MODEL_OPTIONS` plus any
  models discovered via the local Ollama tags endpoint.
- `switchModel` writes the provider + model into `gitpilot.config.yml`.
- `reviewPR` passes `--pr <id>` when a PR number is entered, and runs
  without the flag when the input box is cancelled.
- Webview `generateCommit` causes the host to run `gitpilot commit
  --dry-run` and post `commitDraft` with the parsed message.
- Webview `commitMessage` triggers a `git commit -m "<msg>"` and only
  on success does the host post `commandDone` and a refreshed
  `repoStatus`.
- Webview `generatePr` runs `gitpilot pr create --dry-run` and posts
  `prDraft` with the parsed `{title, description}`.
- Webview `runReview` runs `gitpilot review --json` and posts
  `reviewResult` with parsed issues; an empty array emits no UI card.
- Status bar shows the running indicator while any host action is in
  flight and resets to "ready" afterwards.
