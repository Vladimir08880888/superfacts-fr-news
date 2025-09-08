/**
 * Theme utilities for debugging and forcing theme updates
 */

export function forceThemeUpdate() {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const currentClasses = Array.from(root.classList);
  const hasLight = currentClasses.includes('light');
  const hasDark = currentClasses.includes('dark');
  
  console.log('Current theme classes:', { hasLight, hasDark, allClasses: currentClasses });
  
  // Force a re-render by toggling a temporary class
  root.classList.add('theme-updating');
  setTimeout(() => {
    root.classList.remove('theme-updating');
  }, 50);
}

export function debugTheme() {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const body = document.body;
  const savedTheme = localStorage.getItem('superfacts-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  console.group('🎨 Theme Debug Info');
  console.log('Saved theme:', savedTheme);
  console.log('System prefers dark:', systemPrefersDark);
  console.log('Root classes:', Array.from(root.classList));
  console.log('Body classes:', Array.from(body.classList));
  console.log('Computed background color:', getComputedStyle(root).backgroundColor);
  console.log('CSS color-scheme:', getComputedStyle(root).colorScheme);
  console.groupEnd();
}

export function cycleTheme() {
  if (typeof window === 'undefined') return;
  
  const currentTheme = localStorage.getItem('superfacts-theme') || 'system';
  const themes = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  
  localStorage.setItem('superfacts-theme', nextTheme);
  
  // Dispatch custom event to trigger theme change
  window.dispatchEvent(new CustomEvent('themeChange', { detail: nextTheme }));
  
  console.log(`Theme cycled from ${currentTheme} to ${nextTheme}`);
  
  return nextTheme;
}
