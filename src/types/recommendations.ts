export interface UserPreferences {
  userId: string;
  favoriteCategories: string[];
  preferredSources: string[];
  readingTime: number; // minutes préférées
  topicsOfInterest: string[];
  sentimentPreference: 'positive' | 'negative' | 'neutral' | 'mixed';
  language: 'fr';
  lastUpdated: string;
}

export interface UserActivity {
  userId: string;
  articleId: string;
  action: 'view' | 'like' | 'share' | 'save' | 'complete_read';
  timestamp: string;
  timeSpent: number; // secondes
  scrollDepth: number; // pourcentage
}

export interface RecommendationScore {
  articleId: string;
  score: number; // 0-100
  reasons: RecommendationReason[];
  confidence: number; // 0-100
  timestamp: string;
}

export interface RecommendationReason {
  type: 'category' | 'source' | 'topic' | 'sentiment' | 'trending' | 'similar_users' | 'time_preference';
  weight: number; // Contribution au score total
  description: string;
  confidence: number;
}

export interface RecommendationResult {
  userId: string;
  recommendations: RecommendedArticle[];
  metadata: {
    totalArticlesAnalyzed: number;
    processingTime: number;
    algorithm: string;
    version: string;
    timestamp: string;
  };
}

export interface RecommendedArticle {
  article: any; // Article type from news-collector
  score: number;
  reasons: RecommendationReason[];
  category: 'trending' | 'for_you' | 'similar' | 'breaking' | 'deep_dive';
}

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  activityHistory: UserActivity[];
  interests: InterestProfile[];
  behaviorMetrics: {
    avgReadingTime: number;
    preferredTimeOfDay: number; // 0-23
    engagementScore: number; // 0-100
    diversityScore: number; // 0-100 (variété des sujets lus)
  };
  similarUsers: string[];
}

export interface InterestProfile {
  topic: string;
  strength: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
  lastEngagement: string;
  keywords: string[];
}

export interface ContentSimilarity {
  articleId1: string;
  articleId2: string;
  similarity: number; // 0-100
  sharedKeywords: string[];
  sharedCategories: string[];
}

export interface TrendingTopics {
  topic: string;
  score: number; // Popularité
  articles: string[]; // IDs des articles
  growth: number; // Taux de croissance
  timeframe: '1h' | '6h' | '24h' | '7d';
}

export interface RecommendationEngine {
  name: string;
  version: string;
  description: string;
  weightings: {
    contentBased: number;
    collaborativeFiltering: number;
    trendingBoost: number;
    recencyBoost: number;
    diversityFactor: number;
  };
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  userId: '',
  favoriteCategories: ['Actualités'],
  preferredSources: [],
  readingTime: 5,
  topicsOfInterest: [],
  sentimentPreference: 'mixed',
  language: 'fr',
  lastUpdated: new Date().toISOString()
};

export const RECOMMENDATION_ENGINES: RecommendationEngine[] = [
  {
    name: 'Balanced',
    version: '1.0',
    description: 'Équilibre entre contenu personnalisé et découverte',
    weightings: {
      contentBased: 0.4,
      collaborativeFiltering: 0.3,
      trendingBoost: 0.2,
      recencyBoost: 0.1,
      diversityFactor: 0.2
    }
  },
  {
    name: 'Discovery',
    version: '1.0',
    description: 'Favorise la découverte de nouveaux contenus',
    weightings: {
      contentBased: 0.2,
      collaborativeFiltering: 0.4,
      trendingBoost: 0.3,
      recencyBoost: 0.1,
      diversityFactor: 0.4
    }
  },
  {
    name: 'Personalized',
    version: '1.0',
    description: 'Maximum de personnalisation',
    weightings: {
      contentBased: 0.6,
      collaborativeFiltering: 0.3,
      trendingBoost: 0.05,
      recencyBoost: 0.05,
      diversityFactor: 0.1
    }
  }
];
