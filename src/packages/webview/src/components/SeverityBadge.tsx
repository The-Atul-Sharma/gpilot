import type { InlineIssue } from '../types.js';
import { severityPill } from '../styles.js';

interface SeverityBadgeProps {
  severity: InlineIssue['severity'];
}

const severityLabel: Record<InlineIssue['severity'], string> = {
  blocker: 'Blocker',
  warning: 'Warning',
  info: 'Info',
};

/** Pill badge that color-codes the issue severity. */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span style={severityPill(severity)} data-severity={severity}>
      {severityLabel[severity]}
    </span>
  );
}
