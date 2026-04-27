import type { PipelineStep } from '../types.js';
import { layout, statusDot } from '../styles.js';

interface StepRowProps {
  step: PipelineStep;
}

const statusLabel: Record<PipelineStep['status'], string> = {
  idle: 'idle',
  running: 'running',
  done: 'done',
  failed: 'failed',
};

/** Single pipeline step: colored status dot + step name + status text. */
export function StepRow({ step }: StepRowProps) {
  return (
    <div style={layout.rowSpread} data-testid={`step-${step.id}`}>
      <div style={layout.rowGap}>
        <span
          style={statusDot(step.status)}
          aria-hidden="true"
          data-testid={`step-${step.id}-dot`}
          data-status={step.status}
        />
        <span>{step.name}</span>
      </div>
      <span style={{ opacity: 0.7, fontSize: 11 }}>{statusLabel[step.status]}</span>
    </div>
  );
}
