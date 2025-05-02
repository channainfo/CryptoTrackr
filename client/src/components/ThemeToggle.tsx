import { useTheme } from "@/components/ui/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    console.log("Current theme:", theme);
  }, [theme]);
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Toggling theme from", theme, "to", newTheme);
    setTheme(newTheme);
  };
  
  return (
    <div className="flex items-center">
      <button
        onClick={toggleTheme}
        className="rounded-md p-2 hover:bg-neutral-light dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;