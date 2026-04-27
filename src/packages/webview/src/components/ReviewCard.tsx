import type { InlineIssue } from '../types.js';
import { layout } from '../styles.js';
import { SeverityBadge } from './SeverityBadge.js';
import { FileLocation } from './FileLocation.js';
import { CommentText } from './CommentText.js';
import { ActionButtons } from './ActionButtons.js';

interface ReviewCardProps {
  issue: InlineIssue;
  prId: string;
  onFix: (prId: string, commentId: string) => void;
  onDismiss: (commentId: string) => void;
}

/** Single review issue card with severity, location, comment, and actions. */
export function ReviewCard({ issue, prId, onFix, onDismiss }: ReviewCardProps) {
  return (
    <div style={layout.card} data-testid={`review-card-${issue.id}`}>
      <div style={layout.rowSpread}>
        <SeverityBadge severity={issue.severity} />
        <FileLocation file={issue.file} line={issue.line} />
      </div>
      <CommentText comment={issue.comment} suggestedFix={issue.suggestedFix} />
      <ActionButtons
        onFix={() => onFix(prId, issue.id)}
        onDismiss={() => onDismiss(issue.id)}
      />
    </div>
  );
}
