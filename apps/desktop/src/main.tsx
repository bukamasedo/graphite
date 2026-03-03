import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import { ErrorBoundary } from './components/common/error-boundary';
import './i18n';
import './styles/globals.css';
import './styles/theme.css';
import './styles/animations.css';
import 'katex/dist/katex.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
