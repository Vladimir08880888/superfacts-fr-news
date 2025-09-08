'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  trackPageView, 
  trackEvent, 
  newsEvents, 
  userEvents,
  enhancedEcommerce,
  GA_MEASUREMENT_ID 
} from '@/lib/analytics';

// Custom hook for Google Analytics integration
export const useAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically on route changes
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const title = document.title;

    // Small delay to ensure the page title is updated
    const timer = setTimeout(() => {
      trackPageView(url, title);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Generic event tracking
  const track = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number,
    customParameters?: { [key: string]: any }
  ) => {
    trackEvent(action, category, label, value, customParameters);
  }, []);

  return {
    // Generic tracking
    track,
    
    // News-specific events
    trackArticleClick: newsEvents.articleClick,
    trackCategoryFilter: newsEvents.categoryFilter,
    trackSearch: newsEvents.search,
    trackLanguageChange: newsEvents.languageChange,
    trackNewsCollection: newsEvents.newsCollection,
    trackTranslation: newsEvents.translation,
    trackFactCheck: newsEvents.factCheck,
    trackSentimentAnalysis: newsEvents.sentimentAnalysis,
    trackRecommendationClick: newsEvents.recommendationClick,
    trackShare: newsEvents.share,
    trackTimeOnArticle: newsEvents.timeOnArticle,
    
    // User behavior events
    trackPreferredCategory: userEvents.preferredCategory,
    trackReadingPattern: userEvents.readingPattern,
    
    // Enhanced ecommerce
    trackContentConsumption: enhancedEcommerce.trackContentConsumption,
    
    // Check if analytics is enabled
    isEnabled: !!GA_MEASUREMENT_ID,
  };
};

// Hook specifically for article reading time tracking
export const useArticleTimeTracking = (articleId: string) => {
  const { trackTimeOnArticle } = useAnalytics();

  useEffect(() => {
    if (!articleId) return;

    const startTime = Date.now();
    let isVisible = true;
    let totalTime = 0;

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isVisible) {
          totalTime += Date.now() - startTime;
          isVisible = false;
        }
      } else {
        if (!isVisible) {
          isVisible = true;
        }
      }
    };

    // Track time when component unmounts or user leaves
    const handleBeforeUnload = () => {
      if (isVisible) {
        totalTime += Date.now() - startTime;
      }
      
      // Only track if user spent more than 10 seconds reading
      if (totalTime > 10000) {
        trackTimeOnArticle(articleId, Math.round(totalTime / 1000));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Track time on cleanup if component unmounts
      if (isVisible) {
        totalTime += Date.now() - startTime;
      }
      
      if (totalTime > 10000) {
        trackTimeOnArticle(articleId, Math.round(totalTime / 1000));
      }
    };
  }, [articleId, trackTimeOnArticle]);
};

// Hook for tracking user reading sessions
export const useReadingSessionTracking = () => {
  const { trackReadingPattern } = useAnalytics();

  useEffect(() => {
    let articlesRead: string[] = [];
    let categoriesRead: Set<string> = new Set();
    let sessionStartTime = Date.now();

    // Function to track article reads
    const trackArticleRead = (articleId: string, category: string) => {
      if (!articlesRead.includes(articleId)) {
        articlesRead.push(articleId);
        categoriesRead.add(category);
      }
    };

    // Function to end session and track patterns
    const endSession = () => {
      const sessionDuration = Date.now() - sessionStartTime;
      
      if (articlesRead.length > 0 && sessionDuration > 30000) { // At least 30 seconds
        trackReadingPattern(
          articlesRead.length,
          Math.round(sessionDuration / 1000),
          Array.from(categoriesRead)
        );
      }
    };

    // Track session end on page unload
    window.addEventListener('beforeunload', endSession);

    // Expose function to track article reads
    (window as any).trackArticleRead = trackArticleRead;

    return () => {
      window.removeEventListener('beforeunload', endSession);
      endSession(); // Track session when component unmounts
      delete (window as any).trackArticleRead;
    };
  }, [trackReadingPattern]);
};

// Hook for search analytics
export const useSearchAnalytics = () => {
  const { trackSearch } = useAnalytics();

  const trackSearchQuery = useCallback((query: string, resultsCount: number = 0) => {
    // Only track non-empty searches
    if (query.trim().length > 0) {
      trackSearch(query.trim(), resultsCount);
    }
  }, [trackSearch]);

  return { trackSearchQuery };
};

// Hook for translation analytics
export const useTranslationAnalytics = () => {
  const { trackLanguageChange, trackTranslation } = useAnalytics();

  const trackLanguageSwitch = useCallback((fromLang: string, toLang: string) => {
    trackLanguageChange(fromLang, toLang);
  }, [trackLanguageChange]);

  const trackTextTranslation = useCallback((fromLang: string, toLang: string, textLength: number) => {
    trackTranslation(fromLang, toLang, textLength);
  }, [trackTranslation]);

  return {
    trackLanguageSwitch,
    trackTextTranslation,
  };
};
