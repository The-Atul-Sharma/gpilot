import type { ChangeEvent } from "react";
import { layout } from "../styles.js";
import type { gitpilotMode, RepoStatus } from "../types.js";

interface PrPanelProps {
  mode: gitpilotMode;
  status: RepoStatus;
  draft: { title: string; description: string };
  running: boolean;
  commitRunning: boolean;
  onGenerate: () => void;
  onCreate: (title: string, description: string) => void;
  onDraftChange: (draft: { title: string; description: string }) => void;
}

const inputStyle = {
  width: "100%",
  fontFamily: "var(--vscode-font-family, sans-serif)",
  fontSize: 12,
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))",
  borderRadius: 4,
  padding: 6,
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  ...inputStyle,
  fontFamily: "var(--vscode-editor-font-family, monospace)",
  minHeight: 140,
  resize: "vertical" as const,
};

export function PrPanel({
  mode,
  status,
  draft,
  running,
  commitRunning,
  onGenerate,
  onCreate,
  onDraftChange,
}: PrPanelProps) {
  if (!status.hasCommit) {
    return (
      <section style={layout.section} aria-label="Pull Request">
        <div style={layout.card}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
            Make a commit before opening a PR.
          </p>
        </div>
      </section>
    );
  }

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onDraftChange({ ...draft, title: event.target.value });
  };
  const handleDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    onDraftChange({ ...draft, description: event.target.value });
  };

  const canCreate = !running && !commitRunning && draft.title.trim().length > 0;
  const generateLabel =
    mode === "gitpilot"
      ? "Generate PR title + description"
      : "Skip — Native Git";

  return (
    <section style={layout.section} aria-label="Pull Request">
      <div style={layout.card}>
        <div style={{ fontSize: 12, opacity: 0.9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ ...layout.monospace, color: "#34a8ff", fontWeight: 700 }}>
            ⎇ {status.branch ?? "(detached)"}
          </code>
          <span
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              fontSize: 11,
              padding: "1px 6px",
              color: status.isBranchPushed ? "#96e1b9" : "rgba(231,234,238,0.66)",
            }}
          >
            {status.isBranchPushed ? "pushed" : "not pushed"}
          </span>
        </div>
        {mode === "gitpilot" ? (
          <button
            style={{ ...layout.secondaryButton, width: "100%" }}
            type="button"
            disabled={running}
            onClick={onGenerate}
          >
            {running ? "Generating..." : `✦ ${generateLabel}`}
          </button>
        ) : (
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
            Native git mode — fill the title and description manually.
          </p>
        )}
        <input
          aria-label="PR title"
          type="text"
          placeholder="PR title"
          value={draft.title}
          onChange={handleTitleChange}
          style={inputStyle}
        />
        <textarea
          aria-label="PR description"
          placeholder="PR description (markdown)"
          value={draft.description}
          onChange={handleDescriptionChange}
          style={textareaStyle}
        />
        <button
          style={{ ...layout.primaryButton, width: "100%" }}
          type="button"
          disabled={!canCreate}
          onClick={() => onCreate(draft.title, draft.description)}
        >
          Create PR
        </button>
      </div>
    </section>
  );
}
