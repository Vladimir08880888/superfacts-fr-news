'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

export function useAdContext(selectedCategory?: string | null) {
  const { currentLanguage } = useTranslation();
  const [userContext, setUserContext] = useState({
    language: currentLanguage,
    device: 'desktop' as 'mobile' | 'desktop' | 'tablet',
    categories: selectedCategory ? [selectedCategory] : [],
    currentUrl: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateContext = () => {
        const width = window.innerWidth;
        let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
        
        if (width < 768) {
          device = 'mobile';
        } else if (width < 1024) {
          device = 'tablet';
        }

        setUserContext(prev => ({
          ...prev,
          language: currentLanguage,
          device,
          categories: selectedCategory ? [selectedCategory] : [],
          currentUrl: window.location.href
        }));
      };

      updateContext();
      window.addEventListener('resize', updateContext);
      
      return () => window.removeEventListener('resize', updateContext);
    }
  }, [currentLanguage, selectedCategory]);

  return userContext;
}
