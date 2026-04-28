import { layout } from "../styles.js";
import type { gitpilotMode } from "../types.js";

interface ModeToggleProps {
  mode: gitpilotMode;
  onChange: (mode: gitpilotMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const isgitpilot = mode === "gitpilot";
  const buttonStyle = (active: boolean) => ({
    ...layout.secondaryButton,
    background: active ? "var(--vscode-button-background)" : "transparent",
    color: active
      ? "var(--vscode-button-foreground)"
      : "var(--vscode-editor-foreground)",
  });
  return (
    <section style={layout.section} aria-label="Mode">
      <h2 style={layout.sectionTitle}>Mode</h2>
      <div role="group" style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          style={buttonStyle(isgitpilot)}
          aria-pressed={isgitpilot}
          onClick={() => onChange("gitpilot")}
        >
          gitpilot (AI)
        </button>
        <button
          type="button"
          style={buttonStyle(!isgitpilot)}
          aria-pressed={!isgitpilot}
          onClick={() => onChange("native")}
        >
          Native Git
        </button>
      </div>
    </section>
  );
}
