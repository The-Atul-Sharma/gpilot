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
      <h2 style={layout.sectionTitle}>
        Code Review{" "}
        <span style={{ float: "right", fontSize: 12, opacity: 0.7 }}>
          {issues.length} issues
        </span>
      </h2>
      <div style={layout.card}>
        <button
          style={{ ...layout.secondaryButton, width: "100%" }}
          type="button"
          disabled={running}
          onClick={onRun}
        >
          {running ? "Reviewing..." : "✦ Generate Review"}
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
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ ...layout.rowGap, justifyContent: "space-between" }}>
                  <SeverityBadge severity={issue.severity} />
                  <code style={{ ...layout.monospace, opacity: 0.7 }}>
                    {issue.file}:{issue.line}
                  </code>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>{issue.comment}</div>
                {issue.suggestedFix ? (
                  <pre
                    style={{
                      ...layout.monospace,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      background: "rgba(255,255,255,0.04)",
                      padding: 6,
                      borderRadius: 4,
                    }}
                  >
                    {issue.suggestedFix}
                  </pre>
                ) : null}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={layout.primaryButton} type="button">
                    Fix
                  </button>
                  <button style={layout.secondaryButton} type="button">
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
