import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="icon-btn" onClick={toggleTheme} aria-label="Переключить тему">
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
