import type { ChangeEvent } from 'react';
import { layout } from '../styles.js';
import { ModelOption } from './ModelOption.js';

interface ModelSwitcherProps {
  currentProvider: string;
  currentModel: string;
  onChange: (provider: string, model: string) => void;
}

interface ModelEntry {
  label: string;
  provider: string;
  model: string;
}

export const MODELS: ReadonlyArray<ModelEntry> = [
  { label: 'Claude Sonnet 4.6', provider: 'claude', model: 'claude-sonnet-4-6' },
  { label: 'Claude Opus 4.6', provider: 'claude', model: 'claude-opus-4-6' },
  { label: 'GPT-4o', provider: 'openai', model: 'gpt-4o' },
  { label: 'Gemini 1.5 Pro', provider: 'gemini', model: 'gemini-1.5-pro' },
  { label: 'Ollama local', provider: 'ollama', model: 'llama3' },
];

/**
 * Section that lets the user switch the active AI model. Forwards the
 * selection to the parent which is responsible for sending switchModel.
 */
export function ModelSwitcher({
  currentProvider,
  currentModel,
  onChange,
}: ModelSwitcherProps) {
  const value = `${currentProvider}:${currentModel}`;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const [provider, model] = event.target.value.split(':');
    if (!provider || !model) return;
    onChange(provider, model);
  };

  return (
    <section style={layout.section} aria-label="AI Model">
      <h2 style={layout.sectionTitle}>AI Model</h2>
      <select
        aria-label="Select AI model"
        style={layout.select}
        value={value}
        onChange={handleChange}
      >
        {MODELS.map((m) => (
          <ModelOption key={`${m.provider}:${m.model}`} provider={m.provider} model={m.model} label={m.label} />
        ))}
      </select>
    </section>
  );
}
