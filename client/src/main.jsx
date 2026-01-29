// Immediate logging
console.log("🚀 main.jsx script started");
console.log("📍 Location:", window.location.href);
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("🔧 API URL:", import.meta.env.VITE_API_URL || "Not set");

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { store } from "./store/index.js";
import "./index.css";

console.log("✅ All imports successful");

// Debug: Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">Error: Root element not found!</div>';
} else {
  console.log("✅ Root element found, mounting React app...");
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid #334155",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "#f8fafc",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#f8fafc", 
                  },
                },
              }}
            />
          </BrowserRouter>
        </Provider>
      </React.StrictMode>
    );
    
    console.log("✅ React app mounted successfully");
  } catch (error) {
    console.error("❌ Error mounting React app:", error);
    const errorHtml = `<div style="padding: 20px; color: red; font-family: Arial; background: #fee; border: 2px solid #c33; margin: 20px; border-radius: 4px;">
      <h1>Error Loading App</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background: #fff; padding: 10px; overflow: auto; white-space: pre-wrap;">${error.stack || 'No stack trace available'}</pre>
      <p><small>Check browser console for more details</small></p>
    </div>`;
    rootElement.innerHTML = errorHtml;
  }
}

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error caught:', e.error);
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.innerHTML.includes('Loading')) {
    rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: Arial; background: #fee; border: 2px solid #c33; margin: 20px; border-radius: 4px;">
      <h1>Application Error</h1>
      <p><strong>Error:</strong> ${e.message}</p>
      <pre style="background: #fff; padding: 10px; overflow: auto; white-space: pre-wrap;">${e.error ? e.error.stack : 'No stack trace available'}</pre>
    </div>`;
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});
