import type { ChangeEvent } from "react";
import { layout } from "../styles.js";
import type { gitpilotMode } from "../types.js";

interface CommitPanelProps {
  mode: gitpilotMode;
  changedFiles: Array<{
    status: string;
    path: string;
    staged: boolean;
    unstaged: boolean;
  }>;
  draft: string;
  running: boolean;
  onGenerate: () => void;
  onCommit: (message: string) => void;
  onDraftChange: (value: string) => void;
  onOpenFileDiff: (path: string) => void;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
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
  changedFiles,
  draft,
  running,
  onGenerate,
  onCommit,
  onDraftChange,
  onOpenFileDiff,
  onStageFile,
  onUnstageFile,
}: CommitPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onDraftChange(event.target.value);
  };
  const canCommit = draft.trim().length > 0 && !running;
  const generateLabel =
    mode === "gitpilot" ? "Generate Commit Message" : "Skip — Native Git";
  const statusColor = (status: string): string => {
    if (status.includes("A") || status.includes("??")) return "#f9a34b";
    if (status.includes("M")) return "#3fc88f";
    if (status.includes("D")) return "#ff7c7c";
    return "rgba(231,234,238,0.8)";
  };
  const splitPath = (path: string): { file: string; dir: string } => {
    const parts = path.split("/");
    const file = parts[parts.length - 1] ?? path;
    const dir = parts.slice(0, -1).join("/");
    return { file, dir };
  };
  const statusForSection = (
    status: string,
    section: "staged" | "working",
  ): string => {
    if (status === "??") return section === "working" ? "A" : "";
    if (status.length >= 2) {
      const indexStatus = status[0] ?? "";
      const worktreeStatus = status[1] ?? "";
      const next = section === "staged" ? indexStatus : worktreeStatus;
      return next.trim() || (section === "staged" ? "M" : "M");
    }
    return status.trim() || "M";
  };
  const fileIcon = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "md") return "codicon codicon-book";
    if (ext === "json" || ext === "yml" || ext === "yaml") return "codicon codicon-symbol-key";
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      return "codicon codicon-symbol-file";
    }
    return "codicon codicon-file";
  };
  const fileIconColor = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "ts") return "#2f9bff";
    if (ext === "tsx") return "#45b6ff";
    if (ext === "js" || ext === "jsx") return "#f5d356";
    if (ext === "json") return "#d6d6d6";
    if (ext === "md") return "#c68cff";
    return "rgba(231,234,238,0.62)";
  };
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "1px 0",
    borderRadius: 4,
  };
  const stagedFiles = changedFiles.filter((file) => file.staged);
  const workingFiles = changedFiles.filter((file) => file.unstaged);
  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    listStyle: "none",
    padding: "4px 2px",
    borderRadius: 0,
    background: "transparent",
    border: "none",
    fontSize: 13,
    fontWeight: 700,
  } as const;
  const sectionBodyStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    paddingTop: 2,
  };
  const fileRowButtonStyle = {
    flex: 1,
    minWidth: 0,
    border: "none",
    borderRadius: 4,
    padding: "3px 6px",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left" as const,
    borderBottom: "none",
  };
  return (
    <section style={layout.section} aria-label="Commit">
      <div style={layout.card}>
        {mode === "gitpilot" ? (
          <button
            style={{ ...layout.secondaryButton, width: "100%" }}
            type="button"
            disabled={running}
            onClick={onGenerate}
          >
            {running ? "◔ Generating..." : `✦ ${generateLabel}`}
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
        <button
          style={{ ...layout.primaryButton, width: "100%" }}
          type="button"
          disabled={!canCommit}
          onClick={() => onCommit(draft)}
        >
          Commit
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          <details open style={{ width: "100%" }}>
            <summary style={sectionHeaderStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ opacity: 0.82 }}>▾</span>
                <span>Staged Changes</span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  opacity: 0.95,
                }}
              >
                {stagedFiles.length}
              </span>
            </summary>
            <div style={sectionBodyStyle}>
              {stagedFiles.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>No staged files.</p>
              ) : (
                stagedFiles.map((file) => (
                  <div
                    key={`staged:${file.status}:${file.path}`}
                    style={rowStyle}
                  >
                    <div
                      style={{
                        ...fileRowButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenFileDiff(file.path)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenFileDiff(file.path);
                        }
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          "var(--vscode-list-hoverBackground, rgba(255,255,255,0.05))";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 20,
                          color: fileIconColor(file.path),
                          flexShrink: 0,
                          opacity: 0.95,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span className={fileIcon(file.path)} style={{ fontSize: 14 }} />
                      </span>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 7,
                            minWidth: 0,
                            flex: 1,
                            fontFamily: "var(--vscode-font-family, sans-serif)",
                          }}
                          title={`${file.status} ${file.path}`}
                        >
                          <span
                            style={{
                              maxWidth: "42%",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12.5,
                              fontWeight: 500,
                            }}
                          >
                            {splitPath(file.path).file}
                          </span>
                          <span
                            style={{
                              opacity: 0.58,
                              flex: 1,
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12.5,
                            }}
                          >
                            {splitPath(file.path).dir}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onUnstageFile(file.path);
                          }}
                          title="Unstage file"
                          style={{
                            border: "none",
                            background: "transparent",
                            color: statusColor(statusForSection(file.status, "staged")),
                            fontWeight: 700,
                            cursor: "pointer",
                            minWidth: 16,
                            padding: 0,
                            fontSize: 12.5,
                          }}
                        >
                          {statusForSection(file.status, "staged")}
                        </button>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>

          <details open style={{ width: "100%" }}>
            <summary style={sectionHeaderStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ opacity: 0.82 }}>▾</span>
                <span>Changes</span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  opacity: 0.95,
                }}
              >
                {workingFiles.length}
              </span>
            </summary>
            <div style={sectionBodyStyle}>
              {workingFiles.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>No working tree changes.</p>
              ) : (
                workingFiles.map((file) => (
                  <div
                    key={`working:${file.status}:${file.path}`}
                    style={rowStyle}
                  >
                    <div
                      style={{
                        ...fileRowButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenFileDiff(file.path)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenFileDiff(file.path);
                        }
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          "var(--vscode-list-hoverBackground, rgba(255,255,255,0.05))";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 20,
                          color: fileIconColor(file.path),
                          flexShrink: 0,
                          opacity: 0.95,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span className={fileIcon(file.path)} style={{ fontSize: 14 }} />
                      </span>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 7,
                            minWidth: 0,
                            flex: 1,
                            fontFamily: "var(--vscode-font-family, sans-serif)",
                          }}
                          title={`${file.status} ${file.path}`}
                        >
                          <span
                            style={{
                              maxWidth: "42%",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12.5,
                              fontWeight: 500,
                            }}
                          >
                            {splitPath(file.path).file}
                          </span>
                          <span
                            style={{
                              opacity: 0.58,
                              flex: 1,
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12.5,
                            }}
                          >
                            {splitPath(file.path).dir}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onStageFile(file.path);
                          }}
                          title="Stage file"
                          style={{
                            border: "none",
                            background: "transparent",
                            color: statusColor(statusForSection(file.status, "working")),
                            fontWeight: 700,
                            cursor: "pointer",
                            minWidth: 16,
                            padding: 0,
                            fontSize: 12.5,
                          }}
                        >
                          {statusForSection(file.status, "working")}
                        </button>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
