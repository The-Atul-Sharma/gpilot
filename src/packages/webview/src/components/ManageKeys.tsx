import { layout } from '../styles.js';

interface ManageKeysProps {
  provider: string;
  aiConfigured: boolean;
  platformConfigured: boolean;
  onManage: () => void;
}

const PROVIDER_LABEL: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini',
  ollama: 'Ollama (local)',
};

export function ManageKeys({
  provider,
  aiConfigured,
  platformConfigured,
  onManage,
}: ManageKeysProps) {
  const providerLabel = PROVIDER_LABEL[provider] ?? provider;
  const aiLabel = provider === 'ollama'
    ? 'No key required'
    : aiConfigured ? 'connected' : 'missing';
  return (
    <section style={layout.section} aria-label="Manage Keys">
      <h2 style={layout.sectionTitle}>API Keys</h2>
      <div style={layout.card}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          <div>
            Provider: <strong>{providerLabel}</strong> — {aiLabel}
          </div>
          <div>
            Platform token: {platformConfigured ? 'connected' : 'missing'}
          </div>
        </div>
        <div>
          <button style={layout.primaryButton} type="button" onClick={onManage}>
            Manage API Keys
          </button>
        </div>
      </div>
    </section>
  );
}
