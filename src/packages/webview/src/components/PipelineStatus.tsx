import type { PipelineStep } from '../types.js';
import { layout } from '../styles.js';
import { StepRow } from './StepRow.js';

interface PipelineStatusProps {
  steps: PipelineStep[];
}

/** Pipeline section: section title + one StepRow per step. */
export function PipelineStatus({ steps }: PipelineStatusProps) {
  return (
    <section style={layout.section} aria-label="Pipeline">
      <h2 style={layout.sectionTitle}>Pipeline</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}
