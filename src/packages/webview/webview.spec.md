# Module: webview

## Purpose
React + Vite sidebar panel rendered inside VS Code as a webview.
Shows pipeline status, review comments, model switcher, and spec
tools. Communicates with the extension host via postMessage.

## Tech stack
- React 18 + TypeScript
- Vite (builds to single dist/index.html)
- Tailwind utility classes only
- VS Code CSS variables for theming (matches user's VS Code theme)

## VS Code CSS variables to use
--vscode-editor-background
--vscode-editor-foreground
--vscode-button-background
--vscode-button-foreground
--vscode-input-background
--vscode-badge-background
--vscode-errorForeground
--vscode-warningForeground
--vscode-notificationsInfoIconForeground

## Message protocol

### Messages FROM extension host TO webview
```ts
type ExtensionMessage =
  | { type: 'pipelineUpdate', steps: PipelineStep[] }
  | { type: 'reviewComplete', issues: InlineIssue[] }
  | { type: 'configUpdate', provider: string, model: string }
  | { type: 'commandRunning', command: string }
  | { type: 'commandDone', command: string }
  | { type: 'commandFailed', command: string, error: string }
```

### Messages FROM webview TO extension host
```ts
type WebviewMessage =
  | { type: 'fixComment', prId: string, commentId: string }
  | { type: 'fixAllBlockers', prId: string }
  | { type: 'dismissComment', commentId: string }
  | { type: 'switchModel', provider: string, model: string }
  | { type: 'generateClaudeMd' }
  | { type: 'generateSpec', filePath: string }
  | { type: 'runCommand', command: string }
```

## Data types
```ts
interface PipelineStep {
  id: string
  name: string
  status: 'idle' | 'running' | 'done' | 'failed'
}

interface InlineIssue {
  id: string
  file: string
  line: number
  severity: 'blocker' | 'warning' | 'info'
  comment: string
  suggestedFix?: string
}
```

## Component tree
App
├── PipelineStatus
│   └── StepRow (one per step)
├── ReviewCommentList
│   └── ReviewCard (one per issue)
│       ├── SeverityBadge
│       ├── FileLocation
│       ├── CommentText
│       └── ActionButtons (Fix / Dismiss)
├── ModelSwitcher
│   └── ModelOption (one per provider/model)
└── SpecTools
├── GenerateClaudeMdButton
└── GenerateSpecButton

## App.tsx
- Listens to window.addEventListener('message') for ExtensionMessage
- Maintains state: steps, issues, currentModel, runningCommand
- Sends messages via acquireVsCodeApi().postMessage()
- Renders all four sections

## PipelineStatus.tsx
Props:
  steps: PipelineStep[]

Renders:
- Section title "Pipeline"
- One StepRow per step showing:
  - Colored dot: gray=idle, blue+spin=running, green=done, red=failed
  - Step name
  - Status text (idle/running/done/failed)

## ReviewCard.tsx
Props:
  issue: InlineIssue
  prId: string
  onFix: (prId: string, commentId: string) => void
  onDismiss: (commentId: string) => void

Renders:
- SeverityBadge: red pill for blocker, amber for warning, blue for info
- File path + line number in monospace
- Comment text
- "✦ Fix" button → calls onFix
- "Dismiss" button → calls onDismiss

## ReviewCommentList.tsx
Props:
  issues: InlineIssue[]
  prId: string
  onFix: (prId: string, commentId: string) => void
  onDismiss: (commentId: string) => void

Renders:
- Section title "Review Comments ({n} issues)"
- If no issues: "No issues found"
- Sorted: blockers first, then warnings, then infos
- One ReviewCard per issue

## ModelSwitcher.tsx
Props:
  currentProvider: string
  currentModel: string
  onChange: (provider: string, model: string) => void

Renders:
- Section title "AI Model"
- Select dropdown showing current model
- Options:
  - Claude Sonnet 4.6  (provider: claude, model: claude-sonnet-4-6)
  - Claude Opus 4.6   (provider: claude, model: claude-opus-4-6)
  - GPT-4o            (provider: openai, model: gpt-4o)
  - Gemini 1.5 Pro    (provider: gemini, model: gemini-1.5-pro)
  - Ollama local      (provider: ollama, model: llama3)
- On change sends switchModel message to extension

## SpecTools.tsx
Props:
  onGenerateClaudeMd: () => void
  onGenerateSpec: () => void

Renders:
- Section title "Spec Tools"
- "Generate CLAUDE.md" button
- "Generate spec for active file" button
- Both buttons send messages to extension on click

## Styling rules
- Background: var(--vscode-editor-background)
- Text: var(--vscode-editor-foreground)
- Buttons: var(--vscode-button-background) bg,
           var(--vscode-button-foreground) text
- Section titles: uppercase, 11px, letter-spacing 0.8px, muted
- Cards: subtle border, 8px border-radius, 12px padding
- Severity colors:
  blocker → var(--vscode-errorForeground)
  warning → var(--vscode-warningForeground)
  info    → var(--vscode-notificationsInfoIconForeground)
- No external CSS files — inline styles using CSS variables only
- No Tailwind CDN — use inline style objects in React

## Rules
- acquireVsCodeApi() called once at module level, never in components
- All postMessage calls go through a single sendMessage() helper
- Components are pure — no direct postMessage calls inside components
- All message handling in App.tsx only
- No routing — single page, all sections always visible
- No external fonts or icons — use VS Code codicons only
- Vite config must set base: './' for correct asset paths in webview

## Tests required
- App renders all four sections
- pipelineUpdate message updates step statuses
- reviewComplete message renders ReviewCards
- Fix button sends fixComment message with correct ids
- Dismiss button sends dismissComment message
- ModelSwitcher sends switchModel on dropdown change
- GenerateClaudeMd button sends generateClaudeMd message
- ReviewCommentList sorts blockers before warnings before infos
- Empty issues shows "No issues found"
- Running step shows spinning indicator