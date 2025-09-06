'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationCache {
  [key: string]: {
    [targetLang: string]: {
      text: string;
      timestamp: number;
    };
  };
}

export interface TranslationContextType {
  currentLanguage: Language;
  supportedLanguages: Language[];
  setCurrentLanguage: (language: Language) => void;
  translateText: (text: string, targetLang?: string) => Promise<string>;
  isTranslating: boolean;
  translationCache: TranslationCache;
  clearCache: () => void;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(SUPPORTED_LANGUAGES[0]); // Default to French
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language and cache from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('superfacts-language');
      const savedCache = localStorage.getItem('superfacts-translation-cache');
      
      if (savedLang) {
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === savedLang);
        if (lang) {
          setCurrentLanguageState(lang);
        }
      }
      
      if (savedCache) {
        try {
          const cache = JSON.parse(savedCache);
          // Clean expired cache entries
          const cleanCache: TranslationCache = {};
          const now = Date.now();
          
          Object.keys(cache).forEach(key => {
            const langCache: any = {};
            Object.keys(cache[key] || {}).forEach(targetLang => {
              const entry = cache[key][targetLang];
              if (entry && now - entry.timestamp < CACHE_DURATION) {
                langCache[targetLang] = entry;
              }
            });
            if (Object.keys(langCache).length > 0) {
              cleanCache[key] = langCache;
            }
          });
          
          setTranslationCache(cleanCache);
        } catch (error) {
          console.error('Failed to load translation cache:', error);
        }
      }
    }
  }, []);

  // Save language and cache to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('superfacts-language', currentLanguage.code);
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('superfacts-translation-cache', JSON.stringify(translationCache));
    }
  }, [translationCache]);

  const setCurrentLanguage = (language: Language) => {
    setCurrentLanguageState(language);
  };

  const translateText = async (text: string, targetLang?: string): Promise<string> => {
    const target = targetLang || currentLanguage.code;
    
    // Don't translate if target language is French (original language)
    if (target === 'fr' || !text.trim()) {
      return text;
    }
    
    // In development, don't attempt translation if window is not available (SSR)
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
      return text;
    }

    // Check cache first
    const cacheKey = text.trim().toLowerCase().substring(0, 100); // Use first 100 chars as key
    const cached = translationCache[cacheKey]?.[target];
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.text;
    }

    setIsTranslating(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang: target,
          sourceLang: 'fr',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const translatedText = result.translatedText || text;

      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: {
          ...prev[cacheKey],
          [target]: {
            text: translatedText,
            timestamp: Date.now(),
          },
        },
      }));

      return translatedText;
    } catch (error) {
      if (error instanceof Error) {
        // Don't log network errors in development - they're expected during dev server startup
        if (process.env.NODE_ENV === 'development' && 
            (error.name === 'AbortError' || error.message.includes('fetch'))) {
          return text; // Silently return original text
        }
        console.warn('Translation error:', error.message);
      }
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  const clearCache = () => {
    setTranslationCache({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('superfacts-translation-cache');
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
        setCurrentLanguage,
        translateText,
        isTranslating,
        translationCache,
        clearCache,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Hook for translating text with caching and loading states
export function useTranslatedText(text: string, dependencies: any[] = []) {
  const { translateText, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!text || currentLanguage.code === 'fr') {
      setTranslatedText(text);
      return;
    }

    let isCancelled = false;
    
    setIsLoading(true);
    translateText(text)
      .then(translated => {
        if (!isCancelled) {
          setTranslatedText(translated);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          // Don't log errors in development mode for network issues
          if (process.env.NODE_ENV !== 'development' || 
              !error.message?.includes('fetch')) {
            console.warn('Translation error:', error);
          }
          setTranslatedText(text);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });
      
    return () => {
      isCancelled = true;
    };
  }, [text, currentLanguage.code, translateText, ...dependencies]);

  return { translatedText, isLoading };
}
