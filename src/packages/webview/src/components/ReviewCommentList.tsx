import type { InlineIssue } from '../types.js';
import { layout } from '../styles.js';
import { ReviewCard } from './ReviewCard.js';

interface ReviewCommentListProps {
  issues: InlineIssue[];
  prId: string;
  onFix: (prId: string, commentId: string) => void;
  onDismiss: (commentId: string) => void;
}

const severityOrder: Record<InlineIssue['severity'], number> = {
  blocker: 0,
  warning: 1,
  info: 2,
};

/**
 * Sorted list of review issues: blockers, then warnings, then infos.
 * Renders a placeholder when the list is empty.
 */
export function ReviewCommentList({
  issues,
  prId,
  onFix,
  onDismiss,
}: ReviewCommentListProps) {
  const sorted = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return (
    <section style={layout.section} aria-label="Review Comments">
      <h2 style={layout.sectionTitle}>Review Comments ({issues.length} issues)</h2>
      {sorted.length === 0 ? (
        <p style={{ margin: 0, opacity: 0.7 }}>No issues found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((issue) => (
            <ReviewCard
              key={issue.id}
              issue={issue}
              prId={prId}
              onFix={onFix}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </section>
  );
}
