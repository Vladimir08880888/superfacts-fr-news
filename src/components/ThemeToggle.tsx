'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { forceThemeUpdate } from '@/lib/theme-utils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Clair' },
    { value: 'dark' as const, icon: Moon, label: 'Sombre' },
    { value: 'system' as const, icon: Monitor, label: 'Système' },
  ];

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    
    // Force theme update after a brief delay to ensure state changes propagate
    setTimeout(() => {
      forceThemeUpdate();
      if (process.env.NODE_ENV === 'development') {
        console.log('🎨 Theme toggled to:', newTheme, 'Effective theme:', effectiveTheme);
      }
    }, 50);
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 relative shadow-sm">
      {themes.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          onClick={() => handleThemeChange(value)}
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-md transition-all duration-300",
            theme === value
              ? "text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          )}
          title={`${label} ${theme === value ? '(actuel)' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-pressed={theme === value}
          aria-label={`Changer vers le thème ${label.toLowerCase()}`}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-md border border-gray-200 dark:border-gray-600"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <Icon className="w-4 h-4 relative z-10" />
        </motion.button>
      ))}
    </div>
  );
}
