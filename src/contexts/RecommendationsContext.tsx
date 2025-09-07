'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article } from '@/lib/news-collector';

interface ReadingHistory {
  articleId: string;
  title: string;
  category: string;
  source: string;
  tags: string[];
  readAt: string;
  readDuration?: number; // in seconds
}

interface UserPreferences {
  favoriteCategories: { [category: string]: number };
  favoriteSources: { [source: string]: number };
  favoriteTags: { [tag: string]: number };
  readingTimes: number[]; // preferred reading times (hours)
}

interface RecommendationsContextType {
  readingHistory: ReadingHistory[];
  userPreferences: UserPreferences;
  addToHistory: (article: Article, readDuration?: number) => void;
  getRecommendations: (articles: Article[], limit?: number) => Article[];
  clearHistory: () => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export function RecommendationsProvider({ children }: { children: ReactNode }) {
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    favoriteCategories: {},
    favoriteSources: {},
    favoriteTags: {},
    readingTimes: []
  });

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('superfacts-reading-history');
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setReadingHistory(history);
          updatePreferences(history);
        } catch (error) {
          console.error('Failed to load reading history:', error);
        }
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && readingHistory.length > 0) {
      // Keep only last 100 articles to avoid localStorage bloat
      const limitedHistory = readingHistory.slice(-100);
      localStorage.setItem('superfacts-reading-history', JSON.stringify(limitedHistory));
      updatePreferences(limitedHistory);
    }
  }, [readingHistory]);

  const updatePreferences = (history: ReadingHistory[]) => {
    const preferences: UserPreferences = {
      favoriteCategories: {},
      favoriteSources: {},
      favoriteTags: {},
      readingTimes: []
    };

    history.forEach((item) => {
      // Count categories
      preferences.favoriteCategories[item.category] = 
        (preferences.favoriteCategories[item.category] || 0) + 1;

      // Count sources
      preferences.favoriteSources[item.source] = 
        (preferences.favoriteSources[item.source] || 0) + 1;

      // Count tags
      item.tags.forEach(tag => {
        preferences.favoriteTags[tag] = 
          (preferences.favoriteTags[tag] || 0) + 1;
      });

      // Track reading times
      const readTime = new Date(item.readAt).getHours();
      preferences.readingTimes.push(readTime);
    });

    setUserPreferences(preferences);
  };

  const addToHistory = (article: Article, readDuration?: number) => {
    const historyItem: ReadingHistory = {
      articleId: article.id,
      title: article.title,
      category: article.category,
      source: article.source,
      tags: article.tags || [],
      readAt: new Date().toISOString(),
      readDuration
    };

    setReadingHistory(prev => {
      // Remove existing entry for this article to avoid duplicates
      const filtered = prev.filter(item => item.articleId !== article.id);
      return [...filtered, historyItem];
    });
  };

  const getRecommendations = (articles: Article[], limit: number = 5): Article[] => {
    if (readingHistory.length === 0) {
      // If no history, return recent hot articles
      return articles
        .filter(article => article.isHot)
        .slice(0, limit);
    }

    // Calculate recommendation scores
    const scoredArticles = articles.map(article => {
      let score = 0;

      // Category preference (30% weight)
      const categoryScore = userPreferences.favoriteCategories[article.category] || 0;
      score += categoryScore * 0.3;

      // Source preference (20% weight)
      const sourceScore = userPreferences.favoriteSources[article.source] || 0;
      score += sourceScore * 0.2;

      // Tags preference (25% weight)
      const tagScore = (article.tags || []).reduce((sum, tag) => {
        return sum + (userPreferences.favoriteTags[tag] || 0);
      }, 0);
      score += tagScore * 0.25;

      // Recency boost (15% weight)
      const articleDate = new Date(article.publishDate);
      const now = new Date();
      const hoursAgo = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 24 - hoursAgo) / 24; // Linear decay over 24 hours
      score += recencyScore * 0.15;

      // Hot article boost (10% weight)
      if (article.isHot) {
        score += 0.1;
      }

      // Avoid already read articles
      const alreadyRead = readingHistory.some(item => item.articleId === article.id);
      if (alreadyRead) {
        score *= 0.1; // Heavily penalize already read articles
      }

      return { article, score };
    });

    // Sort by score and return top articles
    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  };

  const clearHistory = () => {
    setReadingHistory([]);
    setUserPreferences({
      favoriteCategories: {},
      favoriteSources: {},
      favoriteTags: {},
      readingTimes: []
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('superfacts-reading-history');
    }
  };

  return (
    <RecommendationsContext.Provider
      value={{
        readingHistory,
        userPreferences,
        addToHistory,
        getRecommendations,
        clearHistory,
      }}
    >
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
}
