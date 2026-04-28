import { useEffect, useMemo, useState } from "react";
import type {
  ExtensionMessage,
  gitpilotMode,
  InlineIssue,
  ModelEntry,
  RepoStatus,
} from "./types.js";
import { extensionMessageSchema } from "./types.js";
import { sendMessage } from "./vsCodeApi.js";
import { layout } from "./styles.js";
import { ManageKeys } from "./components/ManageKeys.js";
import { CommitPanel } from "./components/CommitPanel.js";
import { PrPanel } from "./components/PrPanel.js";
import { ReviewPanel } from "./components/ReviewPanel.js";
import { ModeToggle } from "./components/ModeToggle.js";
import { ModelSwitcher } from "./components/ModelSwitcher.js";
type MainTab = "commit" | "pr" | "review";

interface CurrentModel {
  provider: string;
  model: string;
}

const DEFAULT_MODEL: CurrentModel = {
  provider: "claude",
  model: "claude-sonnet-4-6",
};
const DEFAULT_MODEL_OPTIONS: ReadonlyArray<ModelEntry> = [
  {
    label: "Claude Sonnet 4.6",
    provider: "claude",
    model: "claude-sonnet-4-6",
  },
];
const DEFAULT_STATUS: RepoStatus = {
  branch: null,
  hasCommit: false,
  isBranchPushed: false,
  hasOpenPR: false,
  changedFiles: [],
};

export function App() {
  const [currentModel, setCurrentModel] = useState<CurrentModel>(DEFAULT_MODEL);
  const [modelOptions, setModelOptions] = useState<ReadonlyArray<ModelEntry>>(
    DEFAULT_MODEL_OPTIONS,
  );
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [aiConfigured, setAiConfigured] = useState<boolean>(false);
  const [platformConfigured, setPlatformConfigured] = useState<boolean>(false);
  const [mode, setMode] = useState<gitpilotMode>("gitpilot");
  const [repoStatus, setRepoStatus] = useState<RepoStatus>(DEFAULT_STATUS);
  const [commitDraft, setCommitDraft] = useState<string>("");
  const [prDraft, setPrDraft] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });
  const [issues, setIssues] = useState<InlineIssue[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>("commit");

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      const result = extensionMessageSchema.safeParse(event.data);
      if (!result.success) return;
      handleExtensionMessage(result.data);
    };
    const requestLatestState = (): void => {
      sendMessage({ type: "requestState" });
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", requestLatestState);
    document.addEventListener("visibilitychange", requestLatestState);
    requestLatestState();
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", requestLatestState);
      document.removeEventListener("visibilitychange", requestLatestState);
    };
  }, []);

  function handleExtensionMessage(message: ExtensionMessage): void {
    switch (message.type) {
      case "configUpdate":
        setCurrentModel({ provider: message.provider, model: message.model });
        return;
      case "modelOptionsUpdate":
        setModelOptions(message.models);
        return;
      case "commandRunning":
        setRunningCommand(message.command);
        setLastError(null);
        return;
      case "commandDone":
        setRunningCommand((current) =>
          current === message.command ? null : current,
        );
        return;
      case "commandFailed":
        setRunningCommand((current) =>
          current === message.command ? null : current,
        );
        setLastError(`${message.command}: ${message.error}`);
        return;
      case "setupStatus":
        setReady(message.ready);
        setAiConfigured(message.aiConfigured);
        setPlatformConfigured(message.platformConfigured);
        return;
      case "commitDraft":
        setCommitDraft(message.message);
        return;
      case "prDraft":
        setPrDraft({ title: message.title, description: message.description });
        return;
      case "reviewResult":
        setIssues(message.issues);
        return;
      case "repoStatus":
        setRepoStatus(message.status);
        return;
      case "modeUpdate":
        setMode(message.mode);
        return;
    }
  }

  function handleSwitchModel(provider: string, model: string): void {
    sendMessage({ type: "switchModel", provider, model });
    setCurrentModel({ provider, model });
  }

  function handleSetupKeys(): void {
    sendMessage({ type: "setupKeys" });
  }

  function handleSetMode(next: gitpilotMode): void {
    sendMessage({ type: "setMode", mode: next });
    setMode(next);
  }

  function handleGenerateCommit(): void {
    sendMessage({ type: "generateCommit" });
  }

  function handleCommit(message: string): void {
    sendMessage({ type: "commitMessage", message });
  }

  function handleGeneratePr(): void {
    sendMessage({ type: "generatePr" });
  }

  function handleCreatePr(title: string, description: string): void {
    sendMessage({ type: "createPr", title, description });
  }

  function handleRunReview(): void {
    sendMessage({ type: "runReview" });
  }

  function handleOpenFileDiff(path: string): void {
    sendMessage({ type: "openFileDiff", path });
  }

  function handleStageFile(path: string): void {
    sendMessage({ type: "stageFile", path });
  }

  function handleUnstageFile(path: string): void {
    sendMessage({ type: "unstageFile", path });
  }

  useEffect(() => {
    if (
      activeTab === "review" &&
      !(mode === "gitpilot" && repoStatus.hasOpenPR)
    ) {
      setActiveTab("pr");
    }
  }, [activeTab, mode, repoStatus.hasOpenPR]);

  const needsSetup = !ready;

  const statusLabel = needsSetup
    ? "Setup Required"
    : runningCommand
      ? "Running..."
      : "Ready";
  const statusColor = needsSetup
    ? "#f9a34b"
    : runningCommand
      ? "#34a8ff"
      : "#3fc88f";

  const contentStyle = useMemo(
    () => ({
      flex: 1,
      overflowY: "auto" as const,
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
      paddingBottom: 96,
    }),
    [],
  );

  const footerStyle = useMemo(
    () => ({
      position: "fixed" as const,
      left: 8,
      right: 8,
      bottom: 0,
      background: "var(--vscode-sideBar-background, rgba(0,0,0,0.12))",
      borderTop: "1px solid rgba(255,255,255,0.12)",
      paddingTop: 6,
      paddingBottom: 8,
      zIndex: 10,
    }),
    [],
  );

  return (
    <div style={layout.page}>
      <div style={layout.app}>
        <div style={contentStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(231,234,238,0.95)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor,
                  display: "inline-block",
                }}
              />
              {statusLabel}
            </div>
            <ModelSwitcher
              currentProvider={currentModel.provider}
              currentModel={currentModel.model}
              models={modelOptions}
              onChange={handleSwitchModel}
            />
          </div>
          <ModeToggle
            mode={mode}
            onChange={handleSetMode}
          />
          {lastError ? (
            <div
              style={{
                color: "var(--vscode-errorForeground)",
                fontSize: 12,
                border: "1px solid rgba(255,124,124,0.5)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
              data-testid="error-banner"
            >
              {lastError}
            </div>
          ) : null}

          {needsSetup ? (
            <section style={layout.section} aria-label="Setup Required">
              <div
                style={{
                  ...layout.card,
                  minHeight: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {mode === "gitpilot" ? (
                  <button
                    style={{ ...layout.primaryButton, minWidth: 180 }}
                    onClick={handleSetupKeys}
                    disabled={runningCommand === "setup"}
                    type="button"
                  >
                    {runningCommand === "setup"
                      ? "Setting up..."
                      : "Manage API Keys"}
                  </button>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
                    Native Git mode is available without AI setup.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={{
                    ...layout.secondaryButton,
                    flex: 1,
                    background:
                      activeTab === "commit"
                        ? "var(--vscode-button-background)"
                        : layout.secondaryButton.background,
                    color:
                      activeTab === "commit"
                        ? "var(--vscode-button-foreground)"
                        : layout.secondaryButton.color,
                  }}
                  onClick={() => setActiveTab("commit")}
                >
                  Commit
                </button>
                <button
                  type="button"
                  style={{
                    ...layout.secondaryButton,
                    flex: 1,
                    background:
                      activeTab === "pr"
                        ? "var(--vscode-button-background)"
                        : layout.secondaryButton.background,
                    color:
                      activeTab === "pr"
                        ? "var(--vscode-button-foreground)"
                        : layout.secondaryButton.color,
                  }}
                  onClick={() => setActiveTab("pr")}
                >
                  Pull Request
                </button>
                {mode === "gitpilot" && repoStatus.hasOpenPR ? (
                  <button
                    type="button"
                    style={{
                      ...layout.secondaryButton,
                      flex: 1,
                      background:
                        activeTab === "review"
                          ? "var(--vscode-button-background)"
                          : layout.secondaryButton.background,
                      color:
                        activeTab === "review"
                          ? "var(--vscode-button-foreground)"
                          : layout.secondaryButton.color,
                    }}
                    onClick={() => setActiveTab("review")}
                  >
                    Review
                  </button>
                ) : null}
              </div>

              {activeTab === "commit" ? (
                <CommitPanel
                  mode={mode}
                  changedFiles={repoStatus.changedFiles}
                  draft={commitDraft}
                  running={runningCommand === "commit"}
                  onGenerate={handleGenerateCommit}
                  onCommit={handleCommit}
                  onDraftChange={setCommitDraft}
                  onOpenFileDiff={handleOpenFileDiff}
                  onStageFile={handleStageFile}
                  onUnstageFile={handleUnstageFile}
                />
              ) : null}

              {activeTab === "review" &&
              mode === "gitpilot" &&
              repoStatus.hasOpenPR ? (
                <ReviewPanel
                  issues={issues}
                  running={runningCommand === "review"}
                  onRun={handleRunReview}
                />
              ) : null}

              {activeTab === "pr" ? (
                <PrPanel
                  mode={mode}
                  status={repoStatus}
                  draft={prDraft}
                  running={runningCommand === "pr"}
                  commitRunning={runningCommand === "commit"}
                  onGenerate={handleGeneratePr}
                  onCreate={handleCreatePr}
                  onDraftChange={setPrDraft}
                />
              ) : null}
            </>
          )}
        </div>

        {mode === "gitpilot" ? (
          <div style={footerStyle}>
            <ManageKeys
              provider={currentModel.provider}
              aiConfigured={aiConfigured}
              platformConfigured={platformConfigured}
              onManage={handleSetupKeys}
            />
          </div>
        ) : (
          <div style={footerStyle}>
            <div
              style={{
                ...layout.card,
                padding: 8,
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.72 }}>
                Native Git mode active.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
