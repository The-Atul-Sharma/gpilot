import { layout } from '../styles.js';

interface GenerateSpecButtonProps {
  onClick: () => void;
}

/** Button that asks the host to generate a .spec.md for the active editor. */
export function GenerateSpecButton({ onClick }: GenerateSpecButtonProps) {
  return (
    <button type="button" style={layout.secondaryButton} onClick={onClick}>
      Generate spec for active file
    </button>
  );
}
