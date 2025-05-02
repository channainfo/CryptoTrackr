import { Moon, Sun } from "lucide-react";

// Super simple direct theme toggle without context
const ThemeToggle = () => {
  const toggleTheme = () => {
    // Log for debugging
    console.log("Toggle button clicked!");
    
    // Check current theme
    const isDark = document.documentElement.classList.contains('dark');
    console.log("Current theme is:", isDark ? "dark" : "light");
    
    // Directly toggle theme classes
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('trailer-theme', 'light');
      console.log("Switched to light mode");
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('trailer-theme', 'dark');
      console.log("Switched to dark mode");
    }
  };
  
  // Check if we're in dark mode 
  const isDarkMode = document.documentElement.classList.contains('dark');
  
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