'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { debugTheme } from '@/lib/theme-utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('superfacts-theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      } else {
        // Set default theme based on system preference if no saved theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setThemeState('system');
        setEffectiveTheme(systemTheme);
      }
    }
  }, []);

  // Update effective theme based on theme setting and system preference
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setEffectiveTheme(systemTheme);
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateEffectiveTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      const body = window.document.body;
      
      // Remove all theme classes
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      
      // Add current theme class
      root.classList.add(effectiveTheme);
      body.classList.add(effectiveTheme);
      
      // Update color scheme meta tag for better browser integration
      let colorScheme = document.querySelector('meta[name="color-scheme"]');
      if (!colorScheme) {
        colorScheme = document.createElement('meta');
        colorScheme.setAttribute('name', 'color-scheme');
        document.head.appendChild(colorScheme);
      }
      colorScheme.setAttribute('content', effectiveTheme === 'dark' ? 'dark light' : 'light dark');
      
      // Debug theme changes in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🎨 Theme applied:', effectiveTheme);
        setTimeout(() => debugTheme(), 100);
      }
    }
  }, [effectiveTheme]);

  // Listen for custom theme change events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as Theme;
      if (['light', 'dark', 'system'].includes(newTheme)) {
        setThemeState(newTheme);
      }
    };

    window.addEventListener('themeChange', handleCustomThemeChange as EventListener);
    return () => {
      window.removeEventListener('themeChange', handleCustomThemeChange as EventListener);
    };
  }, []);

  // Save theme to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('superfacts-theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        effectiveTheme,
      }}
    >
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
