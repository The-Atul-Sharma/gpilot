import type { ChangeEvent } from "react";
import { layout } from "../styles.js";
import type { gitpilotMode, RepoStatus } from "../types.js";

interface PrPanelProps {
  mode: gitpilotMode;
  status: RepoStatus;
  draft: { title: string; description: string };
  running: boolean;
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
  onGenerate,
  onCreate,
  onDraftChange,
}: PrPanelProps) {
  if (!status.hasCommit) {
    return (
      <section style={layout.section} aria-label="Pull Request">
        <h2 style={layout.sectionTitle}>Pull Request</h2>
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

  const canCreate = !running && draft.title.trim().length > 0;
  const generateLabel =
    mode === "gitpilot"
      ? "Generate PR title + description"
      : "Skip — Native Git";

  return (
    <section style={layout.section} aria-label="Pull Request">
      <h2 style={layout.sectionTitle}>Pull Request</h2>
      <div style={layout.card}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Branch{" "}
          <code style={layout.monospace}>{status.branch ?? "(detached)"}</code>{" "}
          {status.isBranchPushed ? "(pushed)" : "(not pushed yet)"}
        </div>
        {mode === "gitpilot" ? (
          <button
            style={layout.secondaryButton}
            type="button"
            disabled={running}
            onClick={onGenerate}
          >
            {running ? "Generating…" : generateLabel}
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
        <div>
          <button
            style={layout.primaryButton}
            type="button"
            disabled={!canCreate}
            onClick={() => onCreate(draft.title, draft.description)}
          >
            Create PR
          </button>
        </div>
      </div>
    </section>
  );
}
