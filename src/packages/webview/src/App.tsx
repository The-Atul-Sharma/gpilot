import { useEffect, useState } from "react";
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

  if (!ready) {
    return (
      <div style={layout.app}>
        <section style={layout.section} aria-label="Setup Required">
          <h2 style={layout.sectionTitle}>Setup Required</h2>
          <div style={layout.card}>
            <p style={{ margin: 0 }}>
              Set at least one AI key and one platform key before using the
              panel.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12,
                opacity: 0.8,
              }}
            >
              <span>AI key: {aiConfigured ? "configured" : "missing"}</span>
              <span>
                Platform key: {platformConfigured ? "configured" : "missing"}
              </span>
            </div>
            <div>
              <button
                style={layout.primaryButton}
                onClick={handleSetupKeys}
                type="button"
              >
                Setup keys
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={layout.app}>
      <ModeToggle mode={mode} onChange={handleSetMode} />
      {runningCommand ? (
        <div
          style={{ opacity: 0.8, fontSize: 12 }}
          data-testid="running-banner"
        >
          Running: {runningCommand}…
        </div>
      ) : null}
      {lastError ? (
        <div
          style={{ color: "var(--vscode-errorForeground)", fontSize: 12 }}
          data-testid="error-banner"
        >
          {lastError}
        </div>
      ) : null}

      <ManageKeys
        provider={currentModel.provider}
        aiConfigured={aiConfigured}
        platformConfigured={platformConfigured}
        onManage={handleSetupKeys}
      />

      <CommitPanel
        mode={mode}
        draft={commitDraft}
        running={runningCommand === "commit"}
        onGenerate={handleGenerateCommit}
        onCommit={handleCommit}
        onDraftChange={setCommitDraft}
      />

      {repoStatus.hasOpenPR ? (
        <ReviewPanel
          issues={issues}
          running={runningCommand === "review"}
          onRun={handleRunReview}
        />
      ) : (
        <PrPanel
          mode={mode}
          status={repoStatus}
          draft={prDraft}
          running={runningCommand === "pr"}
          onGenerate={handleGeneratePr}
          onCreate={handleCreatePr}
          onDraftChange={setPrDraft}
        />
      )}

      <ModelSwitcher
        currentProvider={currentModel.provider}
        currentModel={currentModel.model}
        models={modelOptions}
        onChange={handleSwitchModel}
      />
    </div>
  );
}
