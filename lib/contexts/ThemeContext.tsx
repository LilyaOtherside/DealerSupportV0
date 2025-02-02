'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Встановлення початкової теми
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
      setIsDark(false);
      root.classList.add('light-theme');
      document.body.style.backgroundColor = 'rgb(248, 250, 252)';
      document.body.style.color = 'rgb(15, 23, 42)';
    } else {
      root.classList.remove('light-theme');
      document.body.style.backgroundColor = 'rgb(15, 15, 15)';
      document.body.style.color = 'rgb(255, 255, 255)';
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      // Перемикання на темну тему
      localStorage.setItem('theme', 'dark');
      root.classList.remove('light-theme');
      document.body.style.backgroundColor = 'rgb(15, 15, 15)';
      document.body.style.color = 'rgb(255, 255, 255)';
    } else {
      // Перемикання на світлу тему
      localStorage.setItem('theme', 'light');
      root.classList.add('light-theme');
      document.body.style.backgroundColor = 'rgb(248, 250, 252)';
      document.body.style.color = 'rgb(15, 23, 42)';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);