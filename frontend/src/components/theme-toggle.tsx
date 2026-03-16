"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500"
      aria-label={isDark ? "Activate light mode" : "Activate dark mode"}
      aria-pressed={isDark}
    >
      {/* Avoid mismatched icons before hydration */}
      {mounted && (
        <span className="relative inline-flex">
          <Sun
            className={`h-4 w-4 transform transition-all duration-200 ${
              isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
            }`}
          />
          <Moon
            className={`absolute h-4 w-4 transform transition-all duration-200 ${
              isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
            }`}
          />
        </span>
      )}
    </button>
  );
}

