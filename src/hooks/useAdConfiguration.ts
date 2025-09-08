'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdPlacement } from '@/types/advertising';

export interface AdConfiguration {
  // Ad frequency settings
  betweenArticlesFrequency: number; // Show ad every N articles
  sidebarAdFrequency: number; // Show sidebar ad every N page views
  
  // Ad visibility settings
  enableHeaderAds: boolean;
  enableSidebarAds: boolean;
  enableFooterAds: boolean;
  enableBetweenArticleAds: boolean;
  enableMobileStickyAds: boolean;
  enableNativeAds: boolean;
  
  // User experience settings
  respectUserPreferences: boolean;
  maxAdsPerPage: number;
  adBlockDetection: boolean;
  
  // Targeting settings
  categoryTargeting: boolean;
  languageTargeting: boolean;
  deviceTargeting: boolean;
  
  // Performance settings
  lazyLoadAds: boolean;
  adTimeout: number; // milliseconds
  retryFailedAds: boolean;
}

const defaultConfiguration: AdConfiguration = {
  betweenArticlesFrequency: 4, // Every 4 articles
  sidebarAdFrequency: 1, // Every page view
  
  enableHeaderAds: true,
  enableSidebarAds: true,
  enableFooterAds: true,
  enableBetweenArticleAds: true,
  enableMobileStickyAds: true,
  enableNativeAds: true,
  
  respectUserPreferences: true,
  maxAdsPerPage: 8,
  adBlockDetection: true,
  
  categoryTargeting: true,
  languageTargeting: true,
  deviceTargeting: true,
  
  lazyLoadAds: true,
  adTimeout: 8000, // 8 seconds
  retryFailedAds: true,
};

export function useAdConfiguration() {
  const [configuration, setConfiguration] = useState<AdConfiguration>(defaultConfiguration);
  const [isAdBlockerDetected, setIsAdBlockerDetected] = useState(false);
  const [userHasOptedOut, setUserHasOptedOut] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adConfiguration');
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfiguration(prev => ({ ...prev, ...parsed }));
      }
      
      // Check if user has opted out of ads
      const optOut = localStorage.getItem('userOptedOutOfAds');
      setUserHasOptedOut(optOut === 'true');
    } catch (error) {
      console.warn('Failed to load ad configuration from localStorage:', error);
    }
  }, []);

  // Detect ad blocker
  useEffect(() => {
    if (!configuration.adBlockDetection) return;

    const detectAdBlocker = async () => {
      try {
        // Create a test element that ad blockers typically block
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.position = 'absolute';
        testAd.style.left = '-999px';
        testAd.style.top = '-999px';
        testAd.style.height = '1px';
        testAd.style.width = '1px';
        
        document.body.appendChild(testAd);
        
        // Wait a brief moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if the element was blocked
        const isBlocked = testAd.offsetHeight === 0 || 
                         window.getComputedStyle(testAd).display === 'none' ||
                         window.getComputedStyle(testAd).visibility === 'hidden';
        
        setIsAdBlockerDetected(isBlocked);
        document.body.removeChild(testAd);
      } catch (error) {
        console.warn('Ad blocker detection failed:', error);
      }
    };

    detectAdBlocker();
  }, [configuration.adBlockDetection]);

  // Update configuration
  const updateConfiguration = (updates: Partial<AdConfiguration>) => {
    const newConfig = { ...configuration, ...updates };
    setConfiguration(newConfig);
    
    try {
      localStorage.setItem('adConfiguration', JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save ad configuration to localStorage:', error);
    }
  };

  // Check if a specific ad placement should be shown
  const shouldShowAd = (placement: AdPlacement): boolean => {
    // If user has opted out, don't show any ads
    if (userHasOptedOut) return false;

    // If ad blocker is detected and we respect user preferences
    if (isAdBlockerDetected && configuration.respectUserPreferences) {
      return false;
    }

    switch (placement) {
      case AdPlacement.HEADER:
        return configuration.enableHeaderAds;
      case AdPlacement.SIDEBAR:
        return configuration.enableSidebarAds;
      case AdPlacement.FOOTER:
        return configuration.enableFooterAds;
      case AdPlacement.BETWEEN_ARTICLES:
        return configuration.enableBetweenArticleAds;
      case AdPlacement.MOBILE_STICKY:
        return configuration.enableMobileStickyAds;
      case AdPlacement.ARTICLE_TOP:
      case AdPlacement.ARTICLE_MIDDLE:
      case AdPlacement.ARTICLE_BOTTOM:
        return configuration.enableNativeAds;
      default:
        return true;
    }
  };

  // Calculate if we should show an ad between articles at a specific index
  const shouldShowBetweenArticleAd = (articleIndex: number): boolean => {
    if (!shouldShowAd(AdPlacement.BETWEEN_ARTICLES)) return false;
    return (articleIndex + 1) % configuration.betweenArticlesFrequency === 0;
  };

  // User opt-out functions
  const optOutOfAds = () => {
    setUserHasOptedOut(true);
    localStorage.setItem('userOptedOutOfAds', 'true');
  };

  const optInToAds = () => {
    setUserHasOptedOut(false);
    localStorage.setItem('userOptedOutOfAds', 'false');
  };

  // Ad performance metrics
  const [adMetrics, setAdMetrics] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    failedLoads: 0,
    averageLoadTime: 0,
  });

  const trackAdMetric = (metric: keyof typeof adMetrics, value = 1) => {
    setAdMetrics(prev => ({
      ...prev,
      [metric]: prev[metric] + value,
    }));
  };

  // Computed values
  const adStats = useMemo(() => ({
    clickThroughRate: adMetrics.totalImpressions > 0 
      ? (adMetrics.totalClicks / adMetrics.totalImpressions) * 100 
      : 0,
    loadFailureRate: adMetrics.totalImpressions > 0 
      ? (adMetrics.failedLoads / adMetrics.totalImpressions) * 100 
      : 0,
    isPerformingWell: function() {
      return this.clickThroughRate > 1 && this.loadFailureRate < 10;
    }
  }), [adMetrics]);

  return {
    configuration,
    updateConfiguration,
    shouldShowAd,
    shouldShowBetweenArticleAd,
    isAdBlockerDetected,
    userHasOptedOut,
    optOutOfAds,
    optInToAds,
    adMetrics,
    trackAdMetric,
    adStats,
  };
}
