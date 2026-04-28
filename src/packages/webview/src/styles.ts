import type { CSSProperties } from 'react';
import type { InlineIssue } from './types.js';

export const colors = {
  background: 'var(--vscode-editor-background)',
  foreground: 'var(--vscode-editor-foreground)',
  buttonBackground: 'var(--vscode-button-background)',
  buttonForeground: 'var(--vscode-button-foreground)',
  inputBackground: 'var(--vscode-input-background)',
  badgeBackground: 'var(--vscode-badge-background)',
  errorForeground: 'var(--vscode-errorForeground)',
  warningForeground: 'var(--vscode-warningForeground)',
  infoForeground: 'var(--vscode-notificationsInfoIconForeground)',
} as const;

export const layout: Record<string, CSSProperties> = {
  app: {
    background: colors.background,
    color: colors.foreground,
    fontFamily: 'var(--vscode-font-family, sans-serif)',
    fontSize: 13,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: '0.8px',
    opacity: 0.7,
    margin: 0,
  },
  card: {
    border: '1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  primaryButton: {
    background: colors.buttonBackground,
    color: colors.buttonForeground,
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  secondaryButton: {
    background: 'transparent',
    color: colors.foreground,
    border: '1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))',
    borderRadius: 4,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  select: {
    background: colors.inputBackground,
    color: colors.foreground,
    border: '1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))',
    borderRadius: 4,
    padding: '4px 6px',
    fontSize: 12,
    width: '100%',
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
    opacity: 0.85,
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
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: severityColors[severity],
    color: 'var(--vscode-button-foreground, #fff)',
  };
}

