import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { store } from "./store/index.js";
import "./index.css";

// Debug: Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
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
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">
      <h1>Error Loading App</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>`;
  }
}
