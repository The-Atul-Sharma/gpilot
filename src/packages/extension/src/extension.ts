import * as vscode from "vscode";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dump as dumpYaml, load as parseYaml } from "js-yaml";

const execFileAsync = promisify(execFile);

export type ReviewSeverity = "blocker" | "warning" | "info";

export type gitpilotMode = "gitpilot" | "native";

export interface ReviewIssue {
  id: string;
  file: string;
  line: number;
  severity: ReviewSeverity;
  comment: string;
  suggestedFix?: string;
}

export interface ModelOption {
  label: string;
  detail: string;
  provider: string;
  model: string;
}

export interface RepoStatus {
  branch: string | null;
  hasCommit: boolean;
  isBranchPushed: boolean;
  hasOpenPR: boolean;
}

export interface ExtensionMessageFromWebview {
  type:
    | "switchModel"
    | "setupKeys"
    | "showPanel"
    | "requestState"
    | "generateCommit"
    | "commitMessage"
    | "generatePr"
    | "createPr"
    | "runReview"
    | "setMode"
    | "refreshStatus";
  provider?: string;
  model?: string;
  message?: string;
  title?: string;
  description?: string;
  mode?: gitpilotMode;
}

export interface ExtensionMessageToWebview {
  type:
    | "configUpdate"
    | "modelOptionsUpdate"
    | "setupStatus"
    | "commandRunning"
    | "commandDone"
    | "commandFailed"
    | "commitDraft"
    | "prDraft"
    | "reviewResult"
    | "repoStatus"
    | "modeUpdate";
  provider?: string;
  model?: string;
  models?: Array<{ label: string; provider: string; model: string }>;
  command?: string;
  error?: string;
  aiConfigured?: boolean;
  platformConfigured?: boolean;
  ready?: boolean;
  message?: string;
  title?: string;
  description?: string;
  issues?: ReviewIssue[];
  status?: RepoStatus;
  mode?: gitpilotMode;
}

export class ExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtensionError";
  }
}

export const VIEW_ID = "gitpilot.panel";

export const FIRST_LAUNCH_STATE_KEY = "gitpilot.firstLaunchComplete";
export const MODE_STATE_KEY = "gitpilot.mode";

export type SecretKey =
  | "ANTHROPIC_API_KEY"
  | "OPENAI_API_KEY"
  | "GEMINI_API_KEY"
  | "GITHUB_TOKEN"
  | "AZURE_DEVOPS_PAT"
  | "GITLAB_TOKEN";

interface SecretDescriptor {
  key: SecretKey;
  label: string;
  detail: string;
}

export const SECRET_DESCRIPTORS: ReadonlyArray<SecretDescriptor> = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API key",
    detail: "Required for Claude models",
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API key",
    detail: "Required for GPT models",
  },
  {
    key: "GEMINI_API_KEY",
    label: "Gemini API key",
    detail: "Required for Gemini models",
  },
  {
    key: "GITHUB_TOKEN",
    label: "GitHub token",
    detail: "Required to create / review GitHub PRs",
  },
  {
    key: "AZURE_DEVOPS_PAT",
    label: "Azure DevOps PAT",
    detail: "Required for Azure DevOps PRs",
  },
  {
    key: "GITLAB_TOKEN",
    label: "GitLab token",
    detail: "Required for GitLab MRs",
  },
];

export const MODEL_OPTIONS: ReadonlyArray<ModelOption> = [
  {
    label: "Claude Sonnet 4.6",
    detail: "Fast and smart — recommended",
    provider: "claude",
    model: "claude-sonnet-4-6",
  },
  {
    label: "Claude Opus 4.7",
    detail: "Most capable, slower",
    provider: "claude",
    model: "claude-opus-4-7",
  },
  {
    label: "GPT-4o",
    detail: "OpenAI — requires OPENAI_API_KEY",
    provider: "openai",
    model: "gpt-4o",
  },
  {
    label: "Gemini 2.5 Pro",
    detail: "Google — requires GEMINI_API_KEY",
    provider: "gemini",
    model: "gemini-2.5-pro",
  },
  {
    label: "Gemini 2.0 Flash",
    detail: "Google fast model — requires GEMINI_API_KEY",
    provider: "gemini",
    model: "gemini-2.0-flash",
  },
];

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
}

const OLLAMA_TAGS_ENDPOINT = "http://localhost:11434/api/tags";

async function fetchLocalOllamaModelOptions(): Promise<ModelOption[]> {
  try {
    const response = await fetch(OLLAMA_TAGS_ENDPOINT);
    if (!response.ok) return [];
    const data = (await response.json()) as OllamaTagsResponse;
    const installed = (data.models ?? [])
      .map((entry) => entry.name ?? entry.model ?? "")
      .filter((name) => name.length > 0);
    const unique = Array.from(new Set(installed)).sort();
    return unique.map((model) => ({
      label: `Ollama: ${model}`,
      detail: "Installed locally in Ollama",
      provider: "ollama",
      model,
    }));
  } catch {
    return [];
  }
}

const TERMINAL_NAME = "gitpilot";

const SECRETS_SERVICE_NAME = "gitpilot";

interface KeytarLike {
  setPassword(
    service: string,
    account: string,
    password: string,
  ): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

let keytarPromise: Promise<KeytarLike | null> | null = null;

async function loadKeytar(): Promise<KeytarLike | null> {
  if (keytarPromise) return keytarPromise;
  keytarPromise = (async () => {
    try {
      const mod = (await import("keytar")) as
        | KeytarLike
        | { default: KeytarLike };
      return "default" in mod && mod.default
        ? mod.default
        : (mod as KeytarLike);
    } catch {
      return null;
    }
  })();
  return keytarPromise;
}

export async function hasSecret(key: SecretKey): Promise<boolean> {
  const keytar = await loadKeytar();
  if (!keytar) return false;
  const value = await keytar.getPassword(SECRETS_SERVICE_NAME, key);
  return Boolean(value);
}

export async function setSecret(key: SecretKey, value: string): Promise<void> {
  const keytar = await loadKeytar();
  if (!keytar) {
    throw new ExtensionError(
      "Cannot save API key: native keychain module (keytar) failed to load. On Linux, install libsecret-1-dev and reload VS Code.",
    );
  }
  await keytar.setPassword(SECRETS_SERVICE_NAME, key, value);
}

export async function deleteSecret(key: SecretKey): Promise<void> {
  const keytar = await loadKeytar();
  if (!keytar) return;
  await keytar.deletePassword(SECRETS_SERVICE_NAME, key);
}

export async function promptForSecret(
  descriptor: SecretDescriptor,
): Promise<boolean> {
  const existed = await hasSecret(descriptor.key);
  const value = await vscode.window.showInputBox({
    prompt: `${descriptor.label} — ${descriptor.detail}`,
    placeHolder: existed
      ? "Leave empty to keep current value"
      : "Paste the key here",
    password: true,
    ignoreFocusOut: true,
  });
  if (value === undefined) return false;
  if (value === "") return existed;
  await setSecret(descriptor.key, value);
  await vscode.window.showInformationMessage(
    `gitpilot: Saved ${descriptor.label}.`,
  );
  return true;
}

export async function manageApiKeys(): Promise<void> {
  while (true) {
    const items: Array<
      vscode.QuickPickItem & { descriptor?: SecretDescriptor; action?: "clear" }
    > = [];
    for (const d of SECRET_DESCRIPTORS) {
      const set = await hasSecret(d.key);
      items.push({
        label: `${set ? "$(check)" : "$(circle-large-outline)"} ${d.label}`,
        description: set ? "set" : "not set",
        detail: d.detail,
        descriptor: d,
      });
    }
    items.push({ label: "$(trash) Clear a saved key…", action: "clear" });

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "Select an API key to set or update",
      ignoreFocusOut: true,
    });
    if (!picked) return;

    if (picked.action === "clear") {
      await clearSecretFlow();
      continue;
    }
    if (picked.descriptor) {
      await promptForSecret(picked.descriptor);
    }
  }
}

async function clearSecretFlow(): Promise<void> {
  const items: Array<vscode.QuickPickItem & { descriptor: SecretDescriptor }> =
    [];
  for (const d of SECRET_DESCRIPTORS) {
    if (await hasSecret(d.key)) {
      items.push({ label: d.label, detail: d.detail, descriptor: d });
    }
  }
  if (items.length === 0) {
    await vscode.window.showInformationMessage(
      "gitpilot: No saved keys to clear.",
    );
    return;
  }
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a key to remove from the keychain",
    ignoreFocusOut: true,
  });
  if (!picked) return;
  await deleteSecret(picked.descriptor.key);
  await vscode.window.showInformationMessage(
    `gitpilot: Cleared ${picked.descriptor.label}.`,
  );
}

export async function runFirstLaunchSetupIfNeeded(
  context: vscode.ExtensionContext,
): Promise<void> {
  const done = context.globalState.get<boolean>(FIRST_LAUNCH_STATE_KEY);
  if (done) return;
  const aiConfigured =
    (await hasSecret("ANTHROPIC_API_KEY")) ||
    (await hasSecret("OPENAI_API_KEY")) ||
    (await hasSecret("GEMINI_API_KEY"));
  const platformConfigured =
    (await hasSecret("GITHUB_TOKEN")) ||
    (await hasSecret("AZURE_DEVOPS_PAT")) ||
    (await hasSecret("GITLAB_TOKEN"));
  if (aiConfigured && platformConfigured) {
    await context.globalState.update(FIRST_LAUNCH_STATE_KEY, true);
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    "gitpilot needs AI and platform keys before using the panel. Set them now?",
    "Set up keys",
    "Later",
  );
  if (choice === "Set up keys") {
    await manageApiKeys();
    const aiConfiguredAfterSetup =
      (await hasSecret("ANTHROPIC_API_KEY")) ||
      (await hasSecret("OPENAI_API_KEY")) ||
      (await hasSecret("GEMINI_API_KEY"));
    const platformConfiguredAfterSetup =
      (await hasSecret("GITHUB_TOKEN")) ||
      (await hasSecret("AZURE_DEVOPS_PAT")) ||
      (await hasSecret("GITLAB_TOKEN"));
    if (aiConfiguredAfterSetup && platformConfiguredAfterSetup) {
      await context.globalState.update(FIRST_LAUNCH_STATE_KEY, true);
    }
    return;
  }
}

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/**
 * Run a gitpilot CLI command and capture its stdout. Used for dry-run /
 * JSON commands where the extension needs the data inline rather than
 * showing it to the user in a terminal.
 */
async function execgitpilot(args: string[]): Promise<string> {
  const root = workspaceRoot();
  if (!root) {
    throw new ExtensionError(
      "Open a workspace folder before running gitpilot commands.",
    );
  }
  const { stdout } = await execFileAsync("npx", ["gitpilot", ...args], {
    cwd: root,
    maxBuffer: 50 * 1024 * 1024,
    env: process.env,
  });
  return stdout;
}

function findOrCreateTerminal(): vscode.Terminal {
  const root = workspaceRoot();
  return root
    ? vscode.window.createTerminal({ name: TERMINAL_NAME, cwd: root })
    : vscode.window.createTerminal(TERMINAL_NAME);
}

/** Open a terminal and run a gitpilot CLI command interactively. */
export async function runCommand(
  command: string,
  args: string[] = [],
): Promise<void> {
  const terminal = findOrCreateTerminal();
  terminal.sendText(
    `npx gitpilot ${command}${args.length ? " " + args.join(" ") : ""}`,
  );
}

async function runShellCommand(command: string): Promise<void> {
  const terminal = findOrCreateTerminal();
  terminal.sendText(command);
}

const commitDryRunSchema = z.object({ message: z.string() });
const prDryRunSchema = z.object({
  title: z.string(),
  description: z.string(),
});
const reviewIssueSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().nonnegative(),
  severity: z.enum(["blocker", "warning", "info"]),
  comment: z.string().min(1),
  suggestedFix: z.string().nullable().optional(),
});
const reviewJsonSchema = z.object({
  issues: z.array(reviewIssueSchema),
});
const statusJsonSchema = z.object({
  branch: z.string().nullable(),
  hasCommit: z.boolean(),
  isBranchPushed: z.boolean(),
  hasOpenPR: z.boolean(),
});

function lastJsonLine(stdout: string): string {
  const lines = stdout.split("\n").filter((line) => line.trim().length > 0);
  return lines[lines.length - 1] ?? "";
}

export async function generateCommitMessage(): Promise<string> {
  const stdout = await execgitpilot(["commit", "--dry-run"]);
  const parsed = JSON.parse(lastJsonLine(stdout));
  const result = commitDryRunSchema.parse(parsed);
  return result.message;
}

export async function commitWithMessage(message: string): Promise<void> {
  const root = workspaceRoot();
  if (!root) {
    throw new ExtensionError("Open a workspace folder before committing.");
  }
  if (!message.trim()) {
    throw new ExtensionError("Commit message is empty.");
  }
  await execFileAsync("git", ["commit", "-m", message], {
    cwd: root,
    maxBuffer: 50 * 1024 * 1024,
  });
}

export async function generatePrDraft(): Promise<{
  title: string;
  description: string;
}> {
  const stdout = await execgitpilot(["pr", "create", "--dry-run"]);
  const parsed = JSON.parse(lastJsonLine(stdout));
  return prDryRunSchema.parse(parsed);
}

export async function pushAndCreatePr(
  title: string,
  description: string,
): Promise<void> {
  const root = workspaceRoot();
  if (!root) {
    throw new ExtensionError("Open a workspace folder before creating a PR.");
  }
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedBody = description.replace(/"/g, '\\"');
  await runShellCommand(
    `gh pr create --title "${escapedTitle}" --body "${escapedBody}" --fill-first`,
  );
}

export async function fetchReview(): Promise<ReviewIssue[]> {
  const stdout = await execgitpilot(["review", "--json"]);
  const parsed = JSON.parse(lastJsonLine(stdout));
  const result = reviewJsonSchema.parse(parsed);
  return result.issues.map((issue, idx) => ({
    id: `${issue.file}:${issue.line}:${idx}`,
    file: issue.file,
    line: issue.line,
    severity: issue.severity,
    comment: issue.comment,
    ...(typeof issue.suggestedFix === "string"
      ? { suggestedFix: issue.suggestedFix }
      : {}),
  }));
}

export async function fetchRepoStatus(): Promise<RepoStatus> {
  try {
    const stdout = await execgitpilot(["status", "--json"]);
    const parsed = JSON.parse(lastJsonLine(stdout));
    const result = statusJsonSchema.parse(parsed);
    return {
      branch: result.branch,
      hasCommit: result.hasCommit,
      isBranchPushed: result.isBranchPushed,
      hasOpenPR: result.hasOpenPR,
    };
  } catch {
    return {
      branch: null,
      hasCommit: false,
      isBranchPushed: false,
      hasOpenPR: false,
    };
  }
}

export class gitpilotStatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor(item?: vscode.StatusBarItem) {
    this.item =
      item ??
      vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = "gitpilot.showPanel";
    this.setReady();
    this.item.show();
  }

  setRunning(): void {
    this.item.text = "$(sync~spin) gitpilot running...";
    this.item.tooltip = "gitpilot command in progress";
  }

  setReady(): void {
    this.item.text = "$(check) gitpilot ready";
    this.item.tooltip = "gitpilot is ready. Click to open the panel.";
  }

  dispose(): void {
    this.item.dispose();
  }
}

export async function readCurrentModel(
  workspaceRoot: string,
): Promise<{ provider: string; model: string } | null> {
  try {
    const raw = await readFile(
      join(workspaceRoot, "gitpilot.config.yml"),
      "utf8",
    );
    const parsed = parseYaml(raw) as {
      ai?: { provider?: unknown; model?: unknown };
    } | null;
    const provider = parsed?.ai?.provider;
    const model = parsed?.ai?.model;
    if (typeof provider !== "string" || typeof model !== "string") return null;
    return { provider, model };
  } catch {
    return null;
  }
}

async function writeCurrentModel(
  workspaceRoot: string,
  provider: string,
  model: string,
): Promise<void> {
  const filePath = join(workspaceRoot, "gitpilot.config.yml");
  const raw = await readFile(filePath, "utf8");
  const parsed = parseYaml(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ExtensionError(
      "gitpilot.config.yml must be a YAML object at the root.",
    );
  }
  const next = parsed as Record<string, unknown>;
  const aiSection = next["ai"];
  const ai =
    aiSection && typeof aiSection === "object" && !Array.isArray(aiSection)
      ? (aiSection as Record<string, unknown>)
      : {};
  ai["provider"] = provider;
  ai["model"] = model;
  next["ai"] = ai;
  await writeFile(filePath, dumpYaml(next), "utf8");
}

function resolveWebviewDistUri(
  extensionUri: vscode.Uri,
): vscode.Uri | undefined {
  const candidates = [
    vscode.Uri.joinPath(extensionUri, "media", "webview"),
    vscode.Uri.joinPath(extensionUri, "..", "webview", "dist"),
    vscode.Uri.joinPath(extensionUri, "src", "packages", "webview", "dist"),
  ];
  return candidates.find((candidate) => existsSync(candidate.fsPath));
}

export class gitpilotSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = VIEW_ID;

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly statusBar: gitpilotStatusBar,
    private readonly context: vscode.ExtensionContext,
  ) {}

  private async postSetupStatus(): Promise<void> {
    const aiConfigured =
      (await hasSecret("ANTHROPIC_API_KEY")) ||
      (await hasSecret("OPENAI_API_KEY")) ||
      (await hasSecret("GEMINI_API_KEY"));
    const platformConfigured =
      (await hasSecret("GITHUB_TOKEN")) ||
      (await hasSecret("AZURE_DEVOPS_PAT")) ||
      (await hasSecret("GITLAB_TOKEN"));
    this.post({
      type: "setupStatus",
      aiConfigured,
      platformConfigured,
      ready: aiConfigured && platformConfigured,
    });
  }

  public refreshState(): void {
    this.postState();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    const webviewDistUri = resolveWebviewDistUri(this.extensionUri);
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: webviewDistUri
        ? [this.extensionUri, webviewDistUri]
        : [this.extensionUri],
    };
    webviewView.webview.html = this.renderHtml(
      webviewView.webview,
      webviewDistUri,
    );
    webviewView.webview.onDidReceiveMessage(
      (message: ExtensionMessageFromWebview) => {
        void this.handleMessage(message);
      },
    );
    this.postState();
  }

  notifyModelChanged(provider: string, model: string): void {
    this.post({ type: "configUpdate", provider, model });
  }

  public getMode(): gitpilotMode {
    return this.currentMode();
  }

  public async setMode(mode: gitpilotMode): Promise<void> {
    await this.context.globalState.update(MODE_STATE_KEY, mode);
    this.post({ type: "modeUpdate", mode });
  }

  private currentMode(): gitpilotMode {
    return (
      this.context.globalState.get<gitpilotMode>(MODE_STATE_KEY) ?? "gitpilot"
    );
  }

  private async handleMessage(
    message: ExtensionMessageFromWebview,
  ): Promise<void> {
    switch (message.type) {
      case "generateCommit": {
        await this.runWithStatus("commit", async () => {
          if (this.currentMode() === "native") {
            this.post({ type: "commitDraft", message: "" });
            return;
          }
          const draft = await generateCommitMessage();
          this.post({ type: "commitDraft", message: draft });
        });
        return;
      }
      case "commitMessage": {
        if (typeof message.message !== "string" || !message.message.trim()) {
          this.post({
            type: "commandFailed",
            command: "commit",
            error: "Commit message is empty.",
          });
          return;
        }
        await this.runWithStatus("commit", async () => {
          await commitWithMessage(message.message ?? "");
          await this.postRepoStatus();
        });
        return;
      }
      case "generatePr": {
        await this.runWithStatus("pr", async () => {
          if (this.currentMode() === "native") {
            this.post({ type: "prDraft", title: "", description: "" });
            return;
          }
          const draft = await generatePrDraft();
          this.post({
            type: "prDraft",
            title: draft.title,
            description: draft.description,
          });
        });
        return;
      }
      case "createPr": {
        await this.runWithStatus("pr", async () => {
          await pushAndCreatePr(message.title ?? "", message.description ?? "");
          await this.postRepoStatus();
        });
        return;
      }
      case "runReview": {
        await this.runWithStatus("review", async () => {
          if (this.currentMode() === "native") {
            this.post({ type: "reviewResult", issues: [] });
            return;
          }
          const issues = await fetchReview();
          this.post({ type: "reviewResult", issues });
        });
        return;
      }
      case "switchModel": {
        if (!message.provider || !message.model) {
          throw new ExtensionError(
            "switchModel requires provider and model. Send both from the ModelSwitcher component.",
          );
        }
        const root = workspaceRoot();
        if (!root) {
          throw new ExtensionError(
            "Open a workspace folder to update gitpilot.config.yml.",
          );
        }
        await writeCurrentModel(root, message.provider, message.model);
        await vscode.window.showInformationMessage(
          `gitpilot: Switched model to ${message.provider}/${message.model}.`,
        );
        this.notifyModelChanged(message.provider, message.model);
        return;
      }
      case "setMode": {
        if (message.mode !== "gitpilot" && message.mode !== "native") {
          throw new ExtensionError(
            'setMode requires mode "gitpilot" or "native".',
          );
        }
        await this.context.globalState.update(MODE_STATE_KEY, message.mode);
        this.post({ type: "modeUpdate", mode: message.mode });
        return;
      }
      case "showPanel":
        await vscode.commands.executeCommand(`${VIEW_ID}.focus`);
        return;
      case "setupKeys":
        await manageApiKeys();
        await this.postSetupStatus();
        return;
      case "refreshStatus":
        await this.postRepoStatus();
        return;
      case "requestState":
        this.postState();
        return;
    }
  }

  private async runWithStatus(
    command: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    this.post({ type: "commandRunning", command });
    this.statusBar.setRunning();
    try {
      await fn();
      this.post({ type: "commandDone", command });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      this.post({ type: "commandFailed", command, error: messageText });
    } finally {
      this.statusBar.setReady();
    }
  }

  private postState(): void {
    void this.postSetupStatus();
    void this.postModelOptions();
    this.post({ type: "modeUpdate", mode: this.currentMode() });
    void this.postRepoStatus();
    const root = workspaceRoot();
    if (!root) return;
    void readCurrentModel(root).then((current) => {
      if (current) this.notifyModelChanged(current.provider, current.model);
    });
  }

  private async postRepoStatus(): Promise<void> {
    const status = await fetchRepoStatus();
    this.post({ type: "repoStatus", status });
  }

  private async postModelOptions(): Promise<void> {
    const dynamicOllama = await fetchLocalOllamaModelOptions();
    const merged = [...MODEL_OPTIONS, ...dynamicOllama];
    const seen = new Set<string>();
    const deduped = merged.filter((option) => {
      const key = `${option.provider}:${option.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    this.post({
      type: "modelOptionsUpdate",
      models: deduped.map((m) => ({
        label: m.label,
        provider: m.provider,
        model: m.model,
      })),
    });
  }

  private post(message: ExtensionMessageToWebview): void {
    void this.view?.webview.postMessage(message);
  }

  private renderHtml(
    webview: vscode.Webview,
    webviewDistUri?: vscode.Uri,
  ): string {
    const scriptUri = webviewDistUri
      ? webview
          .asWebviewUri(
            vscode.Uri.joinPath(webviewDistUri, "assets", "index.js"),
          )
          .toString()
      : "";
    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};`;
    const missingBundleNotice = webviewDistUri
      ? ""
      : '<p style="padding:12px;">Webview bundle not found. Run: npm run build in src/packages/extension.</p>';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>gitpilot</title>
</head>
<body>
  <div id="root"></div>
  ${missingBundleNotice}
  ${scriptUri ? `<script type="module" src="${scriptUri}"></script>` : ""}
</body>
</html>`;
  }
}

export async function pickAndSwitchModel(
  sidebar?: gitpilotSidebarProvider,
): Promise<ModelOption | undefined> {
  const picked = await vscode.window.showQuickPick(
    MODEL_OPTIONS.map((m) => ({
      label: m.label,
      detail: m.detail,
      provider: m.provider,
      model: m.model,
    })),
    { placeHolder: "Select AI model" },
  );
  if (!picked) return undefined;
  const root = workspaceRoot();
  if (!root) {
    throw new ExtensionError(
      "Open a workspace folder to update gitpilot.config.yml.",
    );
  }
  await writeCurrentModel(root, picked.provider, picked.model);
  await vscode.window.showInformationMessage(
    `gitpilot: Switched to ${picked.label}`,
  );
  sidebar?.notifyModelChanged(picked.provider, picked.model);
  return {
    label: picked.label,
    detail: picked.detail,
    provider: picked.provider,
    model: picked.model,
  };
}

export async function promptAndReviewPR(): Promise<void> {
  const prId = await vscode.window.showInputBox({
    prompt: "PR number (leave empty for local diff review)",
    placeHolder: "142",
  });
  await runCommand("review", prId ? ["--pr", prId] : []);
}

interface RegisterOptions {
  sidebar: gitpilotSidebarProvider;
  statusBar: gitpilotStatusBar;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  options: RegisterOptions,
): void {
  const { sidebar, statusBar } = options;

  const wrap =
    <A extends unknown[]>(fn: (...args: A) => Promise<void> | void) =>
    async (...args: A): Promise<void> => {
      statusBar.setRunning();
      try {
        await fn(...args);
      } finally {
        statusBar.setReady();
      }
    };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gitpilot.commit",
      wrap(() => runCommand("commit")),
    ),
    vscode.commands.registerCommand(
      "gitpilot.createPR",
      wrap(() => runCommand("pr")),
    ),
    vscode.commands.registerCommand(
      "gitpilot.reviewPR",
      wrap(promptAndReviewPR),
    ),
    vscode.commands.registerCommand(
      "gitpilot.fixAllBlockers",
      wrap(() => runCommand("fix", ["--all"])),
    ),
    vscode.commands.registerCommand(
      "gitpilot.fixComment",
      wrap(async (commentId?: string, prId?: string) => {
        const args: string[] = [];
        if (prId) args.push("--pr", prId);
        if (commentId) args.push("--comment", commentId);
        await runCommand("fix", args);
      }),
    ),
    vscode.commands.registerCommand(
      "gitpilot.switchModel",
      wrap(async () => {
        await pickAndSwitchModel(sidebar);
      }),
    ),
    vscode.commands.registerCommand(
      "gitpilot.auth",
      wrap(async () => {
        await manageApiKeys();
        sidebar.refreshState();
      }),
    ),
    vscode.commands.registerCommand("gitpilot.showPanel", () =>
      vscode.commands.executeCommand(`${VIEW_ID}.focus`),
    ),
    vscode.commands.registerCommand(
      "gitpilot.status",
      wrap(() => runCommand("status")),
    ),
    vscode.commands.registerCommand(
      "gitpilot.toggleMode",
      wrap(async () => {
        const next: gitpilotMode =
          sidebar.getMode() === "gitpilot" ? "native" : "gitpilot";
        await sidebar.setMode(next);
        await vscode.window.showInformationMessage(
          `gitpilot: Mode set to ${next === "gitpilot" ? "Gitpilot (AI)" : "Native Git"}.`,
        );
      }),
    ),
  );
}

interface ActivateInternals {
  sidebar: gitpilotSidebarProvider;
  statusBar: gitpilotStatusBar;
}

const state: { internals: ActivateInternals | undefined } = {
  internals: undefined,
};

export function activate(context: vscode.ExtensionContext): ActivateInternals {
  const statusBar = new gitpilotStatusBar();
  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  const sidebar = new gitpilotSidebarProvider(
    context.extensionUri,
    statusBar,
    context,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      gitpilotSidebarProvider.viewType,
      sidebar,
    ),
  );

  registerCommands(context, { sidebar, statusBar });

  void runFirstLaunchSetupIfNeeded(context);

  state.internals = { sidebar, statusBar };
  return state.internals;
}

export function deactivate(): void {
  state.internals?.statusBar.dispose();
  state.internals = undefined;
}
