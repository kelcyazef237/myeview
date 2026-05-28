import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize theme from localStorage on store creation
  const savedTheme = (typeof window !== "undefined" ? localStorage.getItem("myeview_theme") : null) as Theme | null;
  const initialTheme: Theme = savedTheme || "dark";

  // Apply immediately so the first render uses the correct theme
  if (typeof window !== "undefined") {
    applyThemeToDOM(initialTheme);
  }

  return {
    theme: initialTheme,

    toggleTheme: () =>
      set((state) => {
        const next: Theme = state.theme === "dark" ? "light" : "dark";
        localStorage.setItem("myeview_theme", next);
        applyThemeToDOM(next);
        return { theme: next };
      }),

    setTheme: (theme) => {
      localStorage.setItem("myeview_theme", theme);
      applyThemeToDOM(theme);
      set({ theme });
    },
  };
});
