import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught and handled:', event.reason);
  // Prevent default browser behavior and silent logging
  event.preventDefault();
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Prevent error from bubbling up in production
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
