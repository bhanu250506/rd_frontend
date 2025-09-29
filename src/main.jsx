import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// This file is now the entry point. It imports the main App component
// and renders it to the 'root' div in your index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
