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
    flex: 1,
    borderRadius: 8,
    border: active ? "1px solid rgba(44,156,255,0.65)" : "1px solid transparent",
    background: active ? "linear-gradient(180deg, #1492e8, #0a84d6)" : "transparent",
    color: active ? "#ffffff" : "rgba(231,234,238,0.72)",
    fontWeight: active ? 700 : 600,
  });
  return (
    <section aria-label="Mode">
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#1c2025",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: 4,
        }}
      >
        <button
          type="button"
          style={buttonStyle(isgitpilot)}
          aria-pressed={isgitpilot}
          onClick={() => onChange("gitpilot")}
        >
          ✦ AI Mode
        </button>
        <button
          type="button"
          style={buttonStyle(!isgitpilot)}
          aria-pressed={!isgitpilot}
          onClick={() => onChange("native")}
        >
          ⎇ Native Git
        </button>
      </div>
    </section>
  );
}
