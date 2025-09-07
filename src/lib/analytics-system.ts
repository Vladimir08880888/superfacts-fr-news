import { Article } from './news-collector';

export interface PageView {
  path: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
  sessionId: string;
  userId?: string;
  duration?: number;
}

export interface UserInteractionEvent {
  type: 'click' | 'scroll' | 'search' | 'filter' | 'bookmark' | 'share' | 'like' | 'dislike' | 'comment';
  target: string;
  value?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

export interface ArticleMetrics {
  articleId: string;
  views: number;
  uniqueViews: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  readTime: number[]; // array of read times in seconds
  bounceRate: number;
  clickThroughRate: number;
  engagementScore: number;
  lastUpdated: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  pageViews24h: number;
  avgSessionDuration: number;
  bounceRate: number;
  topArticles: { articleId: string; score: number; title: string }[];
  topCategories: { category: string; views: number }[];
  topSources: { source: string; engagement: number }[];
  performanceMetrics: {
    apiResponseTime: number;
    newsCollectionTime: number;
    translationTime: number;
    cacheHitRate: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
  };
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  message?: string;
  timestamp: string;
}

export class AnalyticsSystem {
  private events: UserInteractionEvent[] = [];
  private pageViews: PageView[] = [];
  private articleMetrics: Map<string, ArticleMetrics> = new Map();
  private maxEventHistory = 10000;
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeFromStorage();
    this.startPeriodicCleanup();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeFromStorage() {
    try {
      const storedEvents = localStorage.getItem('sf_analytics_events');
      if (storedEvents) {
        this.events = JSON.parse(storedEvents).slice(0, this.maxEventHistory);
      }

      const storedPageViews = localStorage.getItem('sf_analytics_pageviews');
      if (storedPageViews) {
        this.pageViews = JSON.parse(storedPageViews).slice(0, this.maxEventHistory);
      }

      const storedMetrics = localStorage.getItem('sf_analytics_metrics');
      if (storedMetrics) {
        const metrics = JSON.parse(storedMetrics);
        this.articleMetrics = new Map(Object.entries(metrics));
      }
    } catch (error) {
      console.error('Error loading analytics from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('sf_analytics_events', JSON.stringify(this.events));
      localStorage.setItem('sf_analytics_pageviews', JSON.stringify(this.pageViews));
      
      const metricsObj = Object.fromEntries(this.articleMetrics);
      localStorage.setItem('sf_analytics_metrics', JSON.stringify(metricsObj));
    } catch (error) {
      console.error('Error saving analytics to storage:', error);
    }
  }

  private startPeriodicCleanup() {
    // Очистка старых данных каждые 5 минут
    setInterval(() => {
      this.cleanupOldData();
      this.saveToStorage();
    }, 5 * 60 * 1000);
  }

  private cleanupOldData() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 дней
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    );
    
    this.pageViews = this.pageViews.filter(view => 
      new Date(view.timestamp) > cutoffDate
    );
  }

  // Трекинг событий
  public trackPageView(path: string, userId?: string) {
    const pageView: PageView = {
      path,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      sessionId: this.sessionId,
      userId
    };

    this.pageViews.push(pageView);
    this.saveToStorage();
  }

  public trackInteraction(
    type: UserInteractionEvent['type'],
    target: string,
    value?: string,
    metadata?: Record<string, any>,
    userId?: string
  ) {
    const event: UserInteractionEvent = {
      type,
      target,
      value,
      metadata,
      timestamp: new Date().toISOString(),
      userId,
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    // Ограничиваем количество событий
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory);
    }
    
    this.saveToStorage();
  }

  public trackArticleView(article: Article, userId?: string) {
    const metrics = this.getOrCreateArticleMetrics(article.id);
    metrics.views++;
    
    // Отслеживаем уникальные просмотры по сессии
    const viewKey = `${this.sessionId}_${article.id}`;
    const existingView = localStorage.getItem(viewKey);
    
    if (!existingView) {
      metrics.uniqueViews++;
      localStorage.setItem(viewKey, 'viewed');
      
      // Очищаем через 24 часа
      setTimeout(() => {
        localStorage.removeItem(viewKey);
      }, 24 * 60 * 60 * 1000);
    }

    this.trackInteraction('click', 'article_view', article.id, {
      title: article.title,
      category: article.category,
      source: article.source
    }, userId);

    this.saveToStorage();
  }

  public trackArticleInteraction(
    article: Article, 
    action: 'like' | 'dislike' | 'bookmark' | 'share' | 'comment',
    userId?: string
  ) {
    const metrics = this.getOrCreateArticleMetrics(article.id);
    
    switch (action) {
      case 'like':
        metrics.likes++;
        break;
      case 'dislike':
        metrics.dislikes++;
        break;
      case 'bookmark':
        metrics.bookmarks++;
        break;
      case 'share':
        metrics.shares++;
        break;
      case 'comment':
        metrics.comments++;
        break;
    }

    metrics.engagementScore = this.calculateEngagementScore(metrics);
    metrics.lastUpdated = new Date().toISOString();

    this.trackInteraction(action, 'article', article.id, {
      title: article.title,
      category: article.category
    }, userId);

    this.saveToStorage();
  }

  public trackReadTime(articleId: string, duration: number) {
    const metrics = this.getOrCreateArticleMetrics(articleId);
    metrics.readTime.push(duration);
    
    // Ограничиваем количество записей времени чтения
    if (metrics.readTime.length > 100) {
      metrics.readTime = metrics.readTime.slice(-50);
    }

    this.saveToStorage();
  }

  private getOrCreateArticleMetrics(articleId: string): ArticleMetrics {
    let metrics = this.articleMetrics.get(articleId);
    
    if (!metrics) {
      metrics = {
        articleId,
        views: 0,
        uniqueViews: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        readTime: [],
        bounceRate: 0,
        clickThroughRate: 0,
        engagementScore: 0,
        lastUpdated: new Date().toISOString()
      };
      
      this.articleMetrics.set(articleId, metrics);
    }

    return metrics;
  }

  private calculateEngagementScore(metrics: ArticleMetrics): number {
    const totalInteractions = metrics.likes + metrics.comments + metrics.shares + metrics.bookmarks;
    const engagementRate = metrics.views > 0 ? totalInteractions / metrics.views : 0;
    const avgReadTime = metrics.readTime.length > 0 
      ? metrics.readTime.reduce((a, b) => a + b, 0) / metrics.readTime.length 
      : 0;
    
    // Формула: (engagement rate * 40) + (avg read time / 60 * 20) + quality bonuses
    let score = (engagementRate * 40) + (avgReadTime / 60 * 20);
    
    // Бонусы за качественные взаимодействия
    if (metrics.likes > metrics.dislikes) score += 10;
    if (metrics.comments > 0) score += 15;
    if (metrics.shares > 0) score += 20;
    
    return Math.min(100, Math.max(0, score));
  }

  // Аналитика и отчеты
  public getSystemMetrics(): SystemMetrics {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Активные пользователи
    const users24h = new Set(
      this.events
        .filter(e => new Date(e.timestamp) > last24h && e.userId)
        .map(e => e.userId)
    ).size;

    const users7d = new Set(
      this.events
        .filter(e => new Date(e.timestamp) > last7d && e.userId)
        .map(e => e.userId)
    ).size;

    // Просмотры страниц
    const pageViews24h = this.pageViews.filter(pv => 
      new Date(pv.timestamp) > last24h
    ).length;

    // Топ статьи по engagement score
    const topArticles = Array.from(this.articleMetrics.values())
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10)
      .map(m => ({
        articleId: m.articleId,
        score: m.engagementScore,
        title: `Article ${m.articleId}` // В реальном проекте получать из БД
      }));

    // Топ категории
    const categoryViews: Record<string, number> = {};
    this.events
      .filter(e => e.type === 'click' && e.target === 'article_view' && e.metadata?.category)
      .forEach(e => {
        const category = e.metadata!.category;
        categoryViews[category] = (categoryViews[category] || 0) + 1;
      });

    const topCategories = Object.entries(categoryViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, views]) => ({ category, views }));

    // Средняя длительность сессии
    const sessions: Record<string, number[]> = {};
    this.pageViews.forEach(pv => {
      if (!sessions[pv.sessionId]) sessions[pv.sessionId] = [];
      sessions[pv.sessionId].push(new Date(pv.timestamp).getTime());
    });

    const sessionDurations = Object.values(sessions).map(timestamps => {
      if (timestamps.length < 2) return 0;
      const sorted = timestamps.sort();
      return (sorted[sorted.length - 1] - sorted[0]) / 1000; // в секундах
    });

    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    return {
      totalUsers: new Set(this.events.map(e => e.userId).filter(Boolean)).size,
      activeUsers24h: users24h,
      activeUsers7d: users7d,
      pageViews24h,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: 0, // Нужно реализовать отдельно
      topArticles,
      topCategories,
      topSources: [], // Нужно реализовать
      performanceMetrics: {
        apiResponseTime: 0, // Из мониторинга API
        newsCollectionTime: 0, // Из новостного коллектора
        translationTime: 0, // Из системы переводов
        cacheHitRate: 0, // Из кеш системы
      },
      errorMetrics: {
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
      }
    };
  }

  public getArticleMetrics(articleId: string): ArticleMetrics | null {
    return this.articleMetrics.get(articleId) || null;
  }

  public getTopArticlesByMetric(metric: keyof ArticleMetrics, limit = 10): ArticleMetrics[] {
    return Array.from(this.articleMetrics.values())
      .sort((a, b) => {
        const aValue = typeof a[metric] === 'number' ? a[metric] as number : 0;
        const bValue = typeof b[metric] === 'number' ? b[metric] as number : 0;
        return bValue - aValue;
      })
      .slice(0, limit);
  }

  public getEventsByType(type: UserInteractionEvent['type'], hours = 24): UserInteractionEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(e => 
      e.type === type && new Date(e.timestamp) > cutoff
    );
  }

  // Health Checks
  public async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // API Health Check
    try {
      const start = performance.now();
      const response = await fetch('/api/news?limit=1');
      const end = performance.now();
      
      checks.push({
        service: 'News API',
        status: response.ok ? 'healthy' : 'error',
        responseTime: Math.round(end - start),
        message: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      checks.push({
        service: 'News API',
        status: 'error',
        responseTime: -1,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Translation Service Health Check
    try {
      const start = performance.now();
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test', targetLang: 'en' })
      });
      const end = performance.now();
      
      checks.push({
        service: 'Translation Service',
        status: response.ok ? 'healthy' : 'warning',
        responseTime: Math.round(end - start),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      checks.push({
        service: 'Translation Service',
        status: 'warning',
        responseTime: -1,
        message: 'Service unavailable',
        timestamp: new Date().toISOString()
      });
    }

    // Local Storage Health Check
    try {
      const testKey = 'sf_health_check';
      localStorage.setItem(testKey, 'test');
      localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      checks.push({
        service: 'Local Storage',
        status: 'healthy',
        responseTime: 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      checks.push({
        service: 'Local Storage',
        status: 'error',
        responseTime: -1,
        message: 'Storage access denied',
        timestamp: new Date().toISOString()
      });
    }

    return checks;
  }

  // A/B Testing Framework
  public getABTestVariant(testName: string, userId: string): string {
    // Простая реализация A/B тестирования
    const hash = this.hashCode(`${testName}_${userId}`);
    const variant = Math.abs(hash) % 2 === 0 ? 'A' : 'B';
    
    this.trackInteraction('click', 'ab_test', testName, {
      variant,
      userId
    }, userId);
    
    return variant;
  }

  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Экспорт данных
  public exportAnalyticsData(): string {
    return JSON.stringify({
      version: '1.0',
      exported: new Date().toISOString(),
      events: this.events,
      pageViews: this.pageViews,
      articleMetrics: Object.fromEntries(this.articleMetrics),
      systemMetrics: this.getSystemMetrics()
    }, null, 2);
  }

  // Очистка данных (для GDPR compliance)
  public clearUserData(userId: string) {
    this.events = this.events.filter(e => e.userId !== userId);
    this.pageViews = this.pageViews.filter(pv => pv.userId !== userId);
    this.saveToStorage();
  }
}

// Singleton instance
export const analytics = new AnalyticsSystem();
