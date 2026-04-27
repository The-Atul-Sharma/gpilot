import { useEffect, useState } from 'react';
import type { ExtensionMessage, InlineIssue, PipelineStep } from './types.js';
import { extensionMessageSchema } from './types.js';
import { sendMessage } from './vsCodeApi.js';
import { ensureSpinnerKeyframes, layout } from './styles.js';
import { PipelineStatus } from './components/PipelineStatus.js';
import { ReviewCommentList } from './components/ReviewCommentList.js';
import { ModelSwitcher } from './components/ModelSwitcher.js';
import { SpecTools } from './components/SpecTools.js';

interface CurrentModel {
  provider: string;
  model: string;
}

interface AppProps {
  initialPrId?: string;
}

const DEFAULT_MODEL: CurrentModel = { provider: 'claude', model: 'claude-sonnet-4-6' };

/**
 * Root webview component. Owns all state, listens for messages from the
 * extension host, and routes outbound actions through sendMessage.
 */
export function App({ initialPrId = '' }: AppProps) {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [issues, setIssues] = useState<InlineIssue[]>([]);
  const [currentModel, setCurrentModel] = useState<CurrentModel>(DEFAULT_MODEL);
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [prId] = useState<string>(initialPrId);

  useEffect(() => {
    ensureSpinnerKeyframes();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      const result = extensionMessageSchema.safeParse(event.data);
      if (!result.success) return;
      handleExtensionMessage(result.data);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function handleExtensionMessage(message: ExtensionMessage): void {
    switch (message.type) {
      case 'pipelineUpdate':
        setSteps(message.steps);
        return;
      case 'reviewComplete':
        setIssues(message.issues);
        return;
      case 'configUpdate':
        setCurrentModel({ provider: message.provider, model: message.model });
        return;
      case 'commandRunning':
        setRunningCommand(message.command);
        setLastError(null);
        return;
      case 'commandDone':
        setRunningCommand((current) => (current === message.command ? null : current));
        return;
      case 'commandFailed':
        setRunningCommand((current) => (current === message.command ? null : current));
        setLastError(`${message.command}: ${message.error}`);
        return;
    }
  }

  function handleFix(targetPrId: string, commentId: string): void {
    if (!targetPrId) {
      setLastError('Cannot fix comment without a PR id. Open the panel from a PR review first.');
      return;
    }
    sendMessage({ type: 'fixComment', prId: targetPrId, commentId });
  }

  function handleDismiss(commentId: string): void {
    sendMessage({ type: 'dismissComment', commentId });
    setIssues((current) => current.filter((issue) => issue.id !== commentId));
  }

  function handleSwitchModel(provider: string, model: string): void {
    sendMessage({ type: 'switchModel', provider, model });
    setCurrentModel({ provider, model });
  }

  function handleGenerateClaudeMd(): void {
    sendMessage({ type: 'generateClaudeMd' });
  }

  function handleGenerateSpec(): void {
    sendMessage({ type: 'generateSpec', filePath: '' });
  }

  return (
    <div style={layout.app}>
      {runningCommand ? (
        <div style={{ opacity: 0.8, fontSize: 12 }} data-testid="running-banner">
          Running: {runningCommand}…
        </div>
      ) : null}
      {lastError ? (
        <div
          style={{ color: 'var(--vscode-errorForeground)', fontSize: 12 }}
          data-testid="error-banner"
        >
          {lastError}
        </div>
      ) : null}
      <PipelineStatus steps={steps} />
      <ReviewCommentList
        issues={issues}
        prId={prId}
        onFix={handleFix}
        onDismiss={handleDismiss}
      />
      <ModelSwitcher
        currentProvider={currentModel.provider}
        currentModel={currentModel.model}
        onChange={handleSwitchModel}
      />
      <SpecTools
        onGenerateClaudeMd={handleGenerateClaudeMd}
        onGenerateSpec={handleGenerateSpec}
      />
    </div>
  );
}
