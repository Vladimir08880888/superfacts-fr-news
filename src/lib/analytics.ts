// Google Analytics 4 configuration and utilities
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        [key: string]: any;
      }
    ) => void;
  }
}

// Get the GA measurement ID from environment variables
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not found');
    return;
  }

  // Configure gtag
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParameters?: { [key: string]: any }
) => {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParameters,
  });
};

// News-specific tracking events for SuperFacts.fr
export const newsEvents = {
  // Track article clicks
  articleClick: (articleId: string, title: string, category: string, source: string) => {
    trackEvent('article_click', 'engagement', title, undefined, {
      article_id: articleId,
      article_category: category,
      news_source: source,
    });
  },

  // Track category filtering
  categoryFilter: (category: string) => {
    trackEvent('category_filter', 'navigation', category);
  },

  // Track search usage
  search: (query: string, resultsCount: number) => {
    trackEvent('search', 'engagement', query, resultsCount);
  },

  // Track language changes
  languageChange: (fromLanguage: string, toLanguage: string) => {
    trackEvent('language_change', 'localization', `${fromLanguage}_to_${toLanguage}`);
  },

  // Track news collection
  newsCollection: (articlesCollected: number) => {
    trackEvent('news_collection', 'content', 'articles_collected', articlesCollected);
  },

  // Track translation usage
  translation: (fromLanguage: string, toLanguage: string, textLength: number) => {
    trackEvent('translation', 'feature', `${fromLanguage}_to_${toLanguage}`, textLength);
  },

  // Track fact-checking usage
  factCheck: (articleId: string) => {
    trackEvent('fact_check', 'feature', 'article_fact_check', undefined, {
      article_id: articleId,
    });
  },

  // Track sentiment analysis
  sentimentAnalysis: (articleId: string, sentiment: string) => {
    trackEvent('sentiment_analysis', 'feature', sentiment, undefined, {
      article_id: articleId,
    });
  },

  // Track recommendation clicks
  recommendationClick: (articleId: string, position: number) => {
    trackEvent('recommendation_click', 'engagement', 'recommended_article', position, {
      article_id: articleId,
    });
  },

  // Track sharing
  share: (articleId: string, platform: string) => {
    trackEvent('share', 'engagement', platform, undefined, {
      article_id: articleId,
    });
  },

  // Track time spent reading
  timeOnArticle: (articleId: string, timeSpent: number) => {
    trackEvent('time_on_article', 'engagement', 'reading_time', timeSpent, {
      article_id: articleId,
    });
  },
};

// Track user preferences and behavior patterns
export const userEvents = {
  // Track preferred categories
  preferredCategory: (categories: string[]) => {
    trackEvent('preferred_categories', 'user_behavior', categories.join(','));
  },

  // Track reading patterns
  readingPattern: (articlesRead: number, timeSpent: number, categories: string[]) => {
    trackEvent('reading_session', 'user_behavior', 'session_complete', articlesRead, {
      total_time: timeSpent,
      categories_read: categories.join(','),
    });
  },
};

// Enhanced ecommerce tracking (for potential future monetization)
export const enhancedEcommerce = {
  // Track content consumption as "purchases"
  trackContentConsumption: (articleId: string, title: string, category: string, value: number = 1) => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'purchase', {
      transaction_id: `article_${articleId}_${Date.now()}`,
      value: value,
      currency: 'EUR',
      items: [
        {
          item_id: articleId,
          item_name: title,
          category: category,
          quantity: 1,
          price: value,
        },
      ],
    });
  },
};
