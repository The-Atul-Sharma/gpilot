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
    <section aria-label="Manage Keys">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.72, paddingTop: 2 }}>
        <span>{provider === "ollama" ? "Ollama local mode" : `${providerLabel} ${aiLabel}`}</span>
        <button
          type="button"
          onClick={onManage}
          style={{
            border: "none",
            background: "transparent",
            color: platformConfigured ? "#e7eaee" : "#6eb7ff",
            cursor: "pointer",
            padding: 0,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Manage API Keys
        </button>
      </div>
    </section>
  );
}
