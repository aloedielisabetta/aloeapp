
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Prevent full page reloads caused by Vite HMR WebSocket reconnections
// when switching tabs or resuming the browser in development.
if ((import.meta as any).hot) {
  (import.meta as any).hot.on('vite:beforeFullReload', () => {
    console.log('Vite: Intercepted and skipped full page reload to preserve app state.');
    throw new Error('Skipping full reload');
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
