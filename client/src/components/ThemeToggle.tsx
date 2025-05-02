import { useTheme } from "@/components/ui/theme-provider";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center">
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-md p-2 hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;