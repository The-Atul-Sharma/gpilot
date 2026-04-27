import { layout } from '../styles.js';

interface ActionButtonsProps {
  onFix: () => void;
  onDismiss: () => void;
}

/** "Fix" and "Dismiss" buttons rendered side-by-side at the bottom of a card. */
export function ActionButtons({ onFix, onDismiss }: ActionButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" style={layout.primaryButton} onClick={onFix}>
        ✦ Fix
      </button>
      <button type="button" style={layout.secondaryButton} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
