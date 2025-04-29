import { createContext, useContext, useEffect, useState } from "react";
import { getAppSettings } from "@/lib/utils";

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Initialize theme outside of component to ensure it happens once
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  // Check localStorage
  const settings = getAppSettings();
  const savedTheme = settings.theme as Theme;
  
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  
  // If no saved theme, check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Only run after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save to localStorage
    const settings = getAppSettings();
    settings.theme = newTheme;
    localStorage.setItem('app_settings', JSON.stringify(settings));
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 