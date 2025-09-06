'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Article } from '@/lib/news-collector';

// Типы пользовательских данных
export interface UserPreferences {
  favoriteCategories: string[];
  preferredSources: string[];
  language: string;
  readingSpeed: 'slow' | 'normal' | 'fast'; // для расчета времени чтения
  sentimentPreference: 'positive' | 'negative' | 'neutral' | 'all';
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showImages: boolean;
  autoTranslate: boolean;
}

export interface ReadingHistory {
  articleId: string;
  title: string;
  readAt: string; // ISO timestamp
  readDuration: number; // в секундах
  completed: boolean; // дочитал ли до конца
}

export interface UserBookmark {
  articleId: string;
  article: Article;
  savedAt: string;
  tags: string[];
  notes?: string;
}

export interface UserActivity {
  totalArticlesRead: number;
  totalReadingTime: number; // в минутах
  favoriteCategories: Record<string, number>; // category -> count
  readingSessions: number;
  lastActiveDate: string;
  streakDays: number; // дни подряд чтения
  achievements: string[];
}

export interface UserNotificationSettings {
  breakingNews: boolean;
  dailyDigest: boolean;
  personalizedRecommendations: boolean;
  trendingTopics: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

export interface UserProfile {
  id: string;
  createdAt: string;
  preferences: UserPreferences;
  bookmarks: UserBookmark[];
  readingHistory: ReadingHistory[];
  activity: UserActivity;
  notifications: UserNotificationSettings;
  customCategories: string[];
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  
  // Основные действия
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Закладки
  addBookmark: (article: Article, tags?: string[], notes?: string) => void;
  removeBookmark: (articleId: string) => void;
  getBookmarks: () => UserBookmark[];
  isBookmarked: (articleId: string) => boolean;
  
  // История чтения
  markAsRead: (article: Article, readDuration?: number, completed?: boolean) => void;
  getReadingHistory: (limit?: number) => ReadingHistory[];
  isRead: (articleId: string) => boolean;
  getReadArticleIds: () => Set<string>;
  
  // Активность
  updateActivity: () => void;
  getStreak: () => number;
  getTotalReadingTime: () => number;
  
  // Уведомления
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) => void;
  
  // Персонализация
  addCustomCategory: (category: string) => void;
  removeCustomCategory: (category: string) => void;
  
  // Экспорт/импорт
  exportUserData: () => string;
  importUserData: (data: string) => boolean;
  
  // Сброс данных
  clearAllData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Генерация уникального ID пользователя
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Дефолтные настройки
const defaultPreferences: UserPreferences = {
  favoriteCategories: [],
  preferredSources: [],
  language: 'fr',
  readingSpeed: 'normal',
  sentimentPreference: 'all',
  notificationsEnabled: true,
  pushNotifications: false,
  emailNotifications: false,
  digestFrequency: 'daily',
  theme: 'auto',
  compactMode: false,
  showImages: true,
  autoTranslate: false,
};

const defaultNotificationSettings: UserNotificationSettings = {
  breakingNews: true,
  dailyDigest: true,
  personalizedRecommendations: true,
  trendingTopics: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const defaultActivity: UserActivity = {
  totalArticlesRead: 0,
  totalReadingTime: 0,
  favoriteCategories: {},
  readingSessions: 0,
  lastActiveDate: new Date().toISOString(),
  streakDays: 0,
  achievements: [],
};

function createDefaultProfile(): UserProfile {
  return {
    id: generateUserId(),
    createdAt: new Date().toISOString(),
    preferences: defaultPreferences,
    bookmarks: [],
    readingHistory: [],
    activity: defaultActivity,
    notifications: defaultNotificationSettings,
    customCategories: [],
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем данные пользователя при инициализации
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Сохраняем данные пользователя при изменениях
  useEffect(() => {
    if (user) {
      saveUserProfile(user);
    }
  }, [user]);

  const loadUserProfile = () => {
    try {
      const stored = localStorage.getItem('superfacts_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Проверяем версию и мигрируем если нужно
        const profile = migrateUserProfile(parsed);
        setUser(profile);
      } else {
        // Создаем новый профиль
        const newProfile = createDefaultProfile();
        setUser(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(createDefaultProfile());
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProfile = (profile: UserProfile) => {
    try {
      localStorage.setItem('superfacts_user_profile', JSON.stringify(profile));
      
      // Также сохраняем сжатую версию для быстрого доступа
      const quickData = {
        bookmarks: profile.bookmarks.map(b => b.articleId),
        readArticles: profile.readingHistory.map(h => h.articleId),
        preferences: profile.preferences,
      };
      localStorage.setItem('superfacts_quick_data', JSON.stringify(quickData));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const migrateUserProfile = (profile: any): UserProfile => {
    // Здесь можно добавить логику миграции для старых версий
    return {
      ...createDefaultProfile(),
      ...profile,
      preferences: { ...defaultPreferences, ...profile.preferences },
      notifications: { ...defaultNotificationSettings, ...profile.notifications },
      activity: { ...defaultActivity, ...profile.activity },
    };
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      preferences: { ...prev.preferences, ...newPreferences }
    } : null);
  };

  const addBookmark = (article: Article, tags: string[] = [], notes?: string) => {
    if (!user) return;

    const bookmark: UserBookmark = {
      articleId: article.id,
      article,
      savedAt: new Date().toISOString(),
      tags,
      notes,
    };

    setUser(prev => prev ? {
      ...prev,
      bookmarks: [bookmark, ...prev.bookmarks.filter(b => b.articleId !== article.id)]
    } : null);
  };

  const removeBookmark = (articleId: string) => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.articleId !== articleId)
    } : null);
  };

  const getBookmarks = (): UserBookmark[] => {
    return user?.bookmarks || [];
  };

  const isBookmarked = (articleId: string): boolean => {
    return user?.bookmarks.some(b => b.articleId === articleId) || false;
  };

  const markAsRead = (article: Article, readDuration: number = 0, completed: boolean = true) => {
    if (!user) return;

    const readEntry: ReadingHistory = {
      articleId: article.id,
      title: article.title,
      readAt: new Date().toISOString(),
      readDuration,
      completed,
    };

    setUser(prev => {
      if (!prev) return null;
      
      // Обновляем историю (убираем дубликаты)
      const filteredHistory = prev.readingHistory.filter(h => h.articleId !== article.id);
      const newHistory = [readEntry, ...filteredHistory].slice(0, 1000); // Ограничиваем размер

      // Обновляем активность
      const newActivity = {
        ...prev.activity,
        totalArticlesRead: prev.activity.totalArticlesRead + 1,
        totalReadingTime: prev.activity.totalReadingTime + Math.round(readDuration / 60),
        favoriteCategories: {
          ...prev.activity.favoriteCategories,
          [article.category]: (prev.activity.favoriteCategories[article.category] || 0) + 1,
        },
        lastActiveDate: new Date().toISOString(),
      };

      return {
        ...prev,
        readingHistory: newHistory,
        activity: newActivity,
      };
    });
  };

  const getReadingHistory = (limit?: number): ReadingHistory[] => {
    const history = user?.readingHistory || [];
    return limit ? history.slice(0, limit) : history;
  };

  const isRead = (articleId: string): boolean => {
    return user?.readingHistory.some(h => h.articleId === articleId) || false;
  };

  const getReadArticleIds = (): Set<string> => {
    return new Set(user?.readingHistory.map(h => h.articleId) || []);
  };

  const updateActivity = () => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      activity: {
        ...prev.activity,
        readingSessions: prev.activity.readingSessions + 1,
        lastActiveDate: new Date().toISOString(),
      }
    } : null);
  };

  const getStreak = (): number => {
    return user?.activity.streakDays || 0;
  };

  const getTotalReadingTime = (): number => {
    return user?.activity.totalReadingTime || 0;
  };

  const updateNotificationSettings = (settings: Partial<UserNotificationSettings>) => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      notifications: { ...prev.notifications, ...settings }
    } : null);
  };

  const addCustomCategory = (category: string) => {
    if (!user || user.customCategories.includes(category)) return;
    
    setUser(prev => prev ? {
      ...prev,
      customCategories: [...prev.customCategories, category]
    } : null);
  };

  const removeCustomCategory = (category: string) => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      customCategories: prev.customCategories.filter(c => c !== category)
    } : null);
  };

  const exportUserData = (): string => {
    if (!user) return '';
    
    return JSON.stringify({
      version: '1.0',
      exported: new Date().toISOString(),
      profile: user,
    }, null, 2);
  };

  const importUserData = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version && parsed.profile) {
        const migratedProfile = migrateUserProfile(parsed.profile);
        setUser(migratedProfile);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing user data:', error);
      return false;
    }
  };

  const clearAllData = () => {
    const newProfile = createDefaultProfile();
    setUser(newProfile);
    localStorage.removeItem('superfacts_user_profile');
    localStorage.removeItem('superfacts_quick_data');
  };

  const value: UserContextType = {
    user,
    isLoading,
    updatePreferences,
    addBookmark,
    removeBookmark,
    getBookmarks,
    isBookmarked,
    markAsRead,
    getReadingHistory,
    isRead,
    getReadArticleIds,
    updateActivity,
    getStreak,
    getTotalReadingTime,
    updateNotificationSettings,
    addCustomCategory,
    removeCustomCategory,
    exportUserData,
    importUserData,
    clearAllData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
