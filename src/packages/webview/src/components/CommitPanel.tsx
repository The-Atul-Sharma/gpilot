import type { ChangeEvent } from "react";
import { layout } from "../styles.js";
import type { gitpilotMode } from "../types.js";

interface CommitPanelProps {
  mode: gitpilotMode;
  draft: string;
  running: boolean;
  onGenerate: () => void;
  onCommit: (message: string) => void;
  onDraftChange: (value: string) => void;
}

const textareaStyle = {
  width: "100%",
  minHeight: 100,
  resize: "vertical" as const,
  fontFamily: "var(--vscode-editor-font-family, monospace)",
  fontSize: 12,
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))",
  borderRadius: 4,
  padding: 8,
  boxSizing: "border-box" as const,
};

export function CommitPanel({
  mode,
  draft,
  running,
  onGenerate,
  onCommit,
  onDraftChange,
}: CommitPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onDraftChange(event.target.value);
  };
  const canCommit = draft.trim().length > 0 && !running;
  const generateLabel =
    mode === "gitpilot" ? "Generate Commit Message" : "Skip — Native Git";
  return (
    <section style={layout.section} aria-label="Commit">
      <h2 style={layout.sectionTitle}>Commit</h2>
      <div style={layout.card}>
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
            Native git mode — write your commit message manually.
          </p>
        )}
        <textarea
          aria-label="Commit message"
          placeholder="Commit message"
          value={draft}
          onChange={handleChange}
          style={textareaStyle}
        />
        <div>
          <button
            style={layout.primaryButton}
            type="button"
            disabled={!canCommit}
            onClick={() => onCommit(draft)}
          >
            Commit
          </button>
        </div>
      </div>
    </section>
  );
}
