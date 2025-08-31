import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { store } from "./store/index.js";
import "./index.css";
import "./config/forceProduction.js";

ReactDOM.createRoot(document.getElementById("root")).render(
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
