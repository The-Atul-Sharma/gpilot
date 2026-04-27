import { layout } from '../styles.js';
import { GenerateClaudeMdButton } from './GenerateClaudeMdButton.js';
import { GenerateSpecButton } from './GenerateSpecButton.js';

interface SpecToolsProps {
  onGenerateClaudeMd: () => void;
  onGenerateSpec: () => void;
}

/** Spec Tools section: CLAUDE.md and active-file spec generation buttons. */
export function SpecTools({ onGenerateClaudeMd, onGenerateSpec }: SpecToolsProps) {
  return (
    <section style={layout.section} aria-label="Spec Tools">
      <h2 style={layout.sectionTitle}>Spec Tools</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <GenerateClaudeMdButton onClick={onGenerateClaudeMd} />
        <GenerateSpecButton onClick={onGenerateSpec} />
      </div>
    </section>
  );
}
