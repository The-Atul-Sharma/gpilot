import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error(
    'Root element #root not found. Make sure index.html contains <div id="root"></div> before main.tsx loads.',
  );
}

document.documentElement.style.background = "transparent";
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.body.style.background = "transparent";
document.body.style.margin = "0";
document.body.style.padding = "0";
root.style.background = "transparent";

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
