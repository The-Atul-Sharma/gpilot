interface CommentTextProps {
  comment: string;
  suggestedFix?: string;
}

/** Renders the review comment body and an optional suggested fix block. */
export function CommentText({ comment, suggestedFix }: CommentTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ margin: 0, lineHeight: 1.4 }}>{comment}</p>
      {suggestedFix ? (
        <pre
          style={{
            margin: 0,
            padding: 8,
            background: 'var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1))',
            borderRadius: 4,
            fontFamily: 'var(--vscode-editor-font-family, monospace)',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
          }}
        >
          {suggestedFix}
        </pre>
      ) : null}
    </div>
  );
}
