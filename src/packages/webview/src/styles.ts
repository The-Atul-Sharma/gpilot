import type { CSSProperties } from "react";
import type { InlineIssue } from "./types.js";

export const colors = {
  background: "#101214",
  surface: "#171a1e",
  surfaceSoft: "#1c2025",
  surfaceMuted: "#13161a",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  foreground: "#e7eaee",
  muted: "rgba(231,234,238,0.66)",
  buttonBackground: "#0a84d6",
  buttonForeground: "#ffffff",
  inputBackground: "#20252b",
  success: "#3fc88f",
  warningForeground: "#ffd36e",
  infoForeground: "#6eb7ff",
  errorForeground: "#ff7c7c",
} as const;

export const layout: Record<string, CSSProperties> = {
  page: {
    background: "transparent",
    padding: 0,
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  app: {
    background: "transparent",
    color: colors.foreground,
    fontFamily: "var(--vscode-font-family, sans-serif)",
    fontSize: 12,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    border: "none",
    borderRadius: 0,
    maxWidth: "none",
    width: "100%",
    margin: 0,
    boxSizing: "border-box",
    minHeight: "100vh",
    overflow: "hidden",
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  sectionTitle: {
    textTransform: "uppercase",
    fontSize: 14,
    letterSpacing: "0.6px",
    opacity: 0.85,
    fontWeight: 700,
    margin: 0,
  },
  card: {
    border: `1px solid ${colors.borderSoft}`,
    background: colors.surface,
    borderRadius: 10,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  primaryButton: {
    background: colors.buttonBackground,
    color: colors.buttonForeground,
    border: "1px solid transparent",
    borderRadius: 7,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  secondaryButton: {
    background: colors.surfaceSoft,
    color: colors.foreground,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  select: {
    background: colors.inputBackground,
    color: colors.foreground,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "6px 9px",
    fontSize: 12,
    width: "100%",
  },
  rowSpread: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowGap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  monospace: {
    fontFamily: 'var(--vscode-editor-font-family, monospace)',
    fontSize: 12,
    opacity: 0.92,
  },
};

const severityColors: Record<InlineIssue['severity'], string> = {
  blocker: colors.errorForeground,
  warning: colors.warningForeground,
  info: colors.infoForeground,
};

export function severityPill(severity: InlineIssue['severity']): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: "0.5px",
    background: severityColors[severity],
    color: "#101214",
  };
}

