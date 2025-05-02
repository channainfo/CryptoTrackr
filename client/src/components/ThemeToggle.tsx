import { useTheme } from "@/components/ui/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check if we're in dark mode by looking at the HTML classes
  useEffect(() => {
    const checkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    
    // Initial check
    checkMode();
    
    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  const toggleTheme = () => {
    // Simply set the opposite of the current actual mode
    setTheme(isDarkMode ? "light" : "dark");
  };
  
  return (
    <div className="flex items-center">
      <button
        onClick={toggleTheme}
        className="rounded-md p-2 hover:bg-neutral-light dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Toggle theme"
      >
        {!isDarkMode ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;