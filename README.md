# 🚀 GitPilot

[![npm version](https://img.shields.io/npm/v/gitpilot.svg)](https://www.npmjs.com/package/gitpilot)
[![npm downloads](https://img.shields.io/npm/dw/gitpilot.svg)](https://www.npmjs.com/package/gitpilot)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/your-publisher.gitpilot)](https://marketplace.visualstudio.com/items?itemName=your-publisher.gitpilot)
[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/your-publisher.gitpilot)](https://marketplace.visualstudio.com/items?itemName=your-publisher.gitpilot)
[![License](https://img.shields.io/npm/l/gitpilot)](./LICENSE)

AI-powered **Git workflow automation CLI and VS Code extension**.

> Generate commits → create pull requests → review code → fix issues — all in one flow.

---

## ✨ Features

### 🖥️ CLI

- ✍️ Generate **conventional commit messages** from staged changes
- 🔀 Create pull requests with **AI-generated titles & descriptions**
- 🔍 Review PRs against configurable rules
- 🛠️ Apply review fixes interactively
- 🧪 Dry-run support for safe previews
- 📊 Repository state detection via `gitpilot status`
- 🤖 Pluggable AI providers:
  - OpenAI (GPT)
  - Anthropic (Claude)
  - Google (Gemini)
  - Ollama (local models)
- 🔌 Pluggable platforms:
  - GitHub
  - Azure DevOps
  - GitLab (extensible)
- 🔐 Secure secrets via OS keychain (`keytar`)

---

### 🧩 VS Code Extension

A clean, task-focused sidebar for your Git workflow.

#### ✍️ Commit Flow

- Generate commit messages using AI
- Edit before committing
- Commit using your final message

---

#### 🔀 Pull Request Flow

- Automatically detects repository state

**If branch is not pushed:**

- Generate PR title and description
- Edit before creating PR
- Push + create PR in one step

**If PR already exists:**

- Skip creation and go to review

---

#### 🔍 Code Review

- Generate AI-powered reviews
- Structured output:
  - 🚫 Blocker
  - ⚠️ Warning
  - ℹ️ Info
- Includes file and line references when available

---

#### 🔁 Mode Toggle

Switch between:

- 🤖 **Gitpilot (AI-powered)**
- 🧑‍💻 **Native Git**

---

#### 🤖 Model Switcher

- Claude, GPT, Gemini, or local Ollama models
- Automatically updates `gitpilot.config.yml`

---

#### 🔑 Key Management

- Manage API keys from within VS Code
- Secure storage via OS keychain

---

#### 🧭 Commands

- `gitpilot: Generate commit message`
- `gitpilot: Create PR with description`
- `gitpilot: Review current PR`
- `gitpilot: Fix all blocker comments`
- `gitpilot: Fix selected comment`
- `gitpilot: Switch AI model`
- `gitpilot: Setup or update API keys`
- `gitpilot: Show panel`
- `gitpilot: Show status`
- `gitpilot: Toggle between AI and Native Git`

#### ⚙️ Settings (`settings.json`)

- `gitpilot.defaultMode` — `"gitpilot"` or `"native"`
- `gitpilot.cliCommand` — override the CLI invocation (default
  `npx gitpilot`)

---

## 🧠 How It Works

The VS Code extension runs all actions via:

```bash
gitpilot ...
```

This ensures:

- Consistent CLI + extension behavior
- No duplicated logic
- Easier maintenance

---

## 📦 Requirements

- Node.js >= 18
- A Git repository
- API keys for selected providers
- VS Code >= 1.85

---

## 📥 Installation

### 🖥️ CLI

```bash
npm install -g gitpilot
```

Verify:

```bash
gitpilot --help
```

### 🧩 VS Code Extension

Install from **VS Code Marketplace**:

1. Open Extensions (`Cmd/Ctrl + Shift + X`)
2. Search for **gitpilot**
3. Click **Install**

---

## ⚙️ Configuration

### 🌱 Environment Variables

```bash
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GITHUB_TOKEN=
AZURE_DEVOPS_PAT=
AZURE_DEVOPS_ORG=
AZURE_DEVOPS_PROJECT=
```

---

### 🔐 Secure Storage

API keys can be stored in OS keychain:

- Used during extension onboarding
- Managed via: `gitpilot: Setup or update API keys`

---

### 🧾 gitpilot.config.yml

Controls:

- AI provider and model
- Git platform
- Interaction mode (`interactive` / `auto`)
- Review rules

---

## 🚀 Usage

### CLI

```bash
gitpilot commit --dry-run
gitpilot commit

gitpilot pr create --dry-run
gitpilot pr create

gitpilot pr review
gitpilot fix

gitpilot status
```

---

### VS Code Extension

1. Open **gitpilot panel**
2. Generate and edit commit message
3. Commit changes
4. Create PR (if applicable)
5. Run AI review

---

## 🧱 Project Structure

```bash
src/
  cli/          CLI entry
  core/         AI, git, secrets, utilities
  modules/      commit, PR, review, fix
  platforms/    Git providers
  packages/
    extension/  VS Code extension
    webview/    React UI
```

---

## 🧪 Local Development & Testing

### 🧩 Package and Install Extension Locally

To package and install the VS Code extension locally:

```bash
cd src/packages/extension
npx @vscode/vsce package # produces gitpilot-<version>.vsix
code --install-extension gitpilot-1.0.0.vsix
```

After installation:

- Reload VS Code
- Click the **gitpilot** icon in the activity bar to open the panel

---

### 🖥️ CLI Local Testing

To test the CLI locally during development:

```bash
npm install
npm run build
npm link
```

---

### 🧪 Debug Extension

1. Open `src/packages/extension` in VS Code
2. Press `F5`
3. Test in Extension Development Host

---

## 🔍 Keywords

AI git workflow, commit message generator, AI PR generator, AI code review, git automation CLI, VS Code git assistant, developer productivity

---

## 📄 License

MIT
