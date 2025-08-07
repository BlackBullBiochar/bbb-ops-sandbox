import React from 'react';                              // only needed if you're not on the automatic JSX runtime
import { createRoot } from 'react-dom/client';           // <-- make sure this is imported
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>              {/* optional, but recommended */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);