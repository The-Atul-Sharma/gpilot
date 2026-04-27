import { webviewMessageSchema, type WebviewMessage } from './types.js';

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState<T = unknown>(): T | undefined;
  setState<T>(state: T): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

export class VsCodeApiUnavailableError extends Error {
  constructor() {
    super(
      'acquireVsCodeApi is not defined. Make sure this bundle is loaded inside a VS Code webview, ' +
        'or stub window.acquireVsCodeApi in tests.',
    );
    this.name = 'VsCodeApiUnavailableError';
  }
}

const vscode: VsCodeApi = (() => {
  if (typeof window === 'undefined' || typeof window.acquireVsCodeApi !== 'function') {
    return {
      postMessage: () => {
        throw new VsCodeApiUnavailableError();
      },
      getState: () => undefined,
      setState: () => undefined,
    };
  }
  return window.acquireVsCodeApi();
})();

/**
 * Send a typed message from the webview to the extension host. All
 * outbound traffic must flow through this helper so we can validate the
 * payload at the boundary and keep components free of postMessage.
 */
export function sendMessage(message: WebviewMessage): void {
  const parsed = webviewMessageSchema.parse(message);
  vscode.postMessage(parsed);
}
