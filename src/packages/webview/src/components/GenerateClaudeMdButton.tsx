import { layout } from '../styles.js';

interface GenerateClaudeMdButtonProps {
  onClick: () => void;
}

/** Button that asks the host to generate a CLAUDE.md for the workspace. */
export function GenerateClaudeMdButton({ onClick }: GenerateClaudeMdButtonProps) {
  return (
    <button type="button" style={layout.primaryButton} onClick={onClick}>
      Generate CLAUDE.md
    </button>
  );
}
