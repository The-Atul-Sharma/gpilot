import { layout } from '../styles.js';
import type { InlineIssue } from '../types.js';
import { SeverityBadge } from './SeverityBadge.js';

interface ReviewPanelProps {
  issues: InlineIssue[];
  running: boolean;
  onRun: () => void;
}

export function ReviewPanel({ issues, running, onRun }: ReviewPanelProps) {
  return (
    <section style={layout.section} aria-label="Code Review">
      <h2 style={layout.sectionTitle}>Code Review</h2>
      <div style={layout.card}>
        <button
          style={layout.primaryButton}
          type="button"
          disabled={running}
          onClick={onRun}
        >
          {running ? 'Reviewing…' : 'Generate Code Review'}
        </button>
        {issues.length > 0 ? (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {issues.map((issue) => (
              <li
                key={issue.id}
                style={{
                  border:
                    '1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))',
                  borderRadius: 6,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={layout.rowGap}>
                  <SeverityBadge severity={issue.severity} />
                  <code style={layout.monospace}>
                    {issue.file}:{issue.line}
                  </code>
                </div>
                <div style={{ fontSize: 12 }}>{issue.comment}</div>
                {issue.suggestedFix ? (
                  <pre
                    style={{
                      ...layout.monospace,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      background:
                        'var(--vscode-textCodeBlock-background, rgba(128,128,128,0.1))',
                      padding: 6,
                      borderRadius: 4,
                    }}
                  >
                    {issue.suggestedFix}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
