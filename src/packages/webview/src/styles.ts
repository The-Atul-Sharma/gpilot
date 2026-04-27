import type { CSSProperties } from 'react';
import type { InlineIssue, PipelineStep } from './types.js';

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

const stepColors: Record<PipelineStep['status'], string> = {
  idle: 'rgba(128,128,128,0.6)',
  running: 'var(--vscode-progressBar-background, #007acc)',
  done: 'var(--vscode-testing-iconPassed, #4caf50)',
  failed: colors.errorForeground,
};

export function statusDot(status: PipelineStep['status']): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: stepColors[status],
    flexShrink: 0,
    animation: status === 'running' ? 'gitflow-spin 1s linear infinite' : undefined,
  };
}

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

/** Inject the keyframes used by the running indicator dot exactly once. */
export function ensureSpinnerKeyframes(): void {
  if (typeof document === 'undefined') return;
  const id = 'gitflow-spin-keyframes';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = '@keyframes gitflow-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
