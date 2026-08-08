import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { installModalStackGlobalListeners } from './app/modal';

installModalStackGlobalListeners();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
