import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error(
    'Root element #root not found. Make sure index.html contains <div id="root"></div> before main.tsx loads.',
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
