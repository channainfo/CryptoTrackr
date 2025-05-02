import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/ui/theme-provider";

// Force light mode as default
if (!localStorage.getItem("trailer-theme")) {
  localStorage.setItem("trailer-theme", "light");
}

// Set the class on HTML element directly to avoid flash of wrong theme
const theme = localStorage.getItem("trailer-theme") || "light";
document.documentElement.classList.remove('dark', 'light');
document.documentElement.classList.add(theme);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="trailer-theme">
    <App />
  </ThemeProvider>
);
