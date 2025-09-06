import { Article } from './news-collector';
import {
  UserPreferences,
  UserActivity,
  RecommendationResult,
  RecommendedArticle,
  UserProfile,
  InterestProfile,
  RecommendationReason,
  TrendingTopics,
  ContentSimilarity,
  RecommendationEngine,
  RECOMMENDATION_ENGINES
} from '@/types/recommendations';

export class RecommendationSystem {
  private userProfiles: Map<string, UserProfile> = new Map();
  private contentSimilarities: Map<string, ContentSimilarity[]> = new Map();
  private trendingTopics: TrendingTopics[] = [];
  private currentEngine: RecommendationEngine;

  constructor(engineName: string = 'Balanced') {
    this.currentEngine = RECOMMENDATION_ENGINES.find(e => e.name === engineName) || RECOMMENDATION_ENGINES[0];
  }

  public async generateRecommendations(
    userId: string, 
    articles: Article[], 
    limit: number = 10
  ): Promise<RecommendationResult> {
    const startTime = performance.now();
    
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = this.createDefaultProfile(userId);
      this.userProfiles.set(userId, userProfile);
    }

    // Mettre à jour les trending topics
    this.updateTrendingTopics(articles);

    // Calculer les similarités de contenu
    this.updateContentSimilarities(articles);

    // Générer les recommandations
    const recommendations = await this.calculateRecommendations(userProfile, articles, limit);

    const endTime = performance.now();

    return {
      userId,
      recommendations,
      metadata: {
        totalArticlesAnalyzed: articles.length,
        processingTime: Math.round(endTime - startTime),
        algorithm: this.currentEngine.name,
        version: this.currentEngine.version,
        timestamp: new Date().toISOString()
      }
    };
  }

  private async calculateRecommendations(
    userProfile: UserProfile, 
    articles: Article[], 
    limit: number
  ): Promise<RecommendedArticle[]> {
    const scoredArticles: { article: Article; totalScore: number; reasons: RecommendationReason[]; category: string }[] = [];

    for (const article of articles) {
      const reasons: RecommendationReason[] = [];
      let totalScore = 0;

      // 1. Score basé sur le contenu
      const contentScore = this.calculateContentScore(userProfile, article, reasons);
      totalScore += contentScore * this.currentEngine.weightings.contentBased;

      // 2. Score collaboratif (similitude avec d'autres utilisateurs)
      const collaborativeScore = this.calculateCollaborativeScore(userProfile, article, reasons);
      totalScore += collaborativeScore * this.currentEngine.weightings.collaborativeFiltering;

      // 3. Bonus trending
      const trendingScore = this.calculateTrendingScore(article, reasons);
      totalScore += trendingScore * this.currentEngine.weightings.trendingBoost;

      // 4. Bonus récence
      const recencyScore = this.calculateRecencyScore(article, reasons);
      totalScore += recencyScore * this.currentEngine.weightings.recencyBoost;

      // 5. Facteur de diversité
      const diversityPenalty = this.calculateDiversityPenalty(userProfile, article);
      totalScore -= diversityPenalty * this.currentEngine.weightings.diversityFactor;

      // Déterminer la catégorie de recommandation
      const category = this.determineRecommendationCategory(article, reasons, totalScore);

      scoredArticles.push({
        article,
        totalScore: Math.max(0, Math.min(100, totalScore)),
        reasons,
        category
      });
    }

    // Trier par score et appliquer la diversité
    const sortedArticles = scoredArticles.sort((a, b) => b.totalScore - a.totalScore);
    const diversifiedArticles = this.applyDiversification(sortedArticles, limit);

    return diversifiedArticles.map(item => ({
      article: item.article,
      score: Math.round(item.totalScore),
      reasons: item.reasons,
      category: item.category as any
    }));
  }

  private calculateContentScore(
    userProfile: UserProfile, 
    article: Article, 
    reasons: RecommendationReason[]
  ): number {
    let score = 0;

    // Score basé sur les catégories préférées
    const categoryMatch = userProfile.preferences.favoriteCategories.includes(article.category);
    if (categoryMatch) {
      const categoryScore = 25;
      score += categoryScore;
      reasons.push({
        type: 'category',
        weight: categoryScore,
        description: `Correspond à votre catégorie préférée: ${article.category}`,
        confidence: 90
      });
    }

    // Score basé sur les sources préférées
    const sourceMatch = userProfile.preferences.preferredSources.includes(article.source);
    if (sourceMatch) {
      const sourceScore = 20;
      score += sourceScore;
      reasons.push({
        type: 'source',
        weight: sourceScore,
        description: `De votre source préférée: ${article.source}`,
        confidence: 85
      });
    }

    // Score basé sur les sujets d'intérêt
    const topicScore = this.calculateTopicScore(userProfile, article);
    if (topicScore > 0) {
      score += topicScore;
      reasons.push({
        type: 'topic',
        weight: topicScore,
        description: 'Correspond à vos centres d\'intérêt',
        confidence: 80
      });
    }

    // Score basé sur la préférence de sentiment
    const sentimentScore = this.calculateSentimentScore(userProfile, article);
    if (sentimentScore > 0) {
      score += sentimentScore;
      reasons.push({
        type: 'sentiment',
        weight: sentimentScore,
        description: `Sentiment ${article.sentiment} correspond à vos préférences`,
        confidence: 70
      });
    }

    // Score basé sur la durée de lecture préférée
    const readingTimeScore = this.calculateReadingTimeScore(userProfile, article);
    if (readingTimeScore > 0) {
      score += readingTimeScore;
      reasons.push({
        type: 'time_preference',
        weight: readingTimeScore,
        description: 'Durée de lecture adaptée à vos préférences',
        confidence: 75
      });
    }

    return score;
  }

  private calculateTopicScore(userProfile: UserProfile, article: Article): number {
    let maxScore = 0;
    
    for (const interest of userProfile.interests) {
      const articleText = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
      const keywordMatches = interest.keywords.filter(keyword => 
        articleText.includes(keyword.toLowerCase())
      ).length;
      
      if (keywordMatches > 0) {
        const score = (keywordMatches / interest.keywords.length) * interest.strength * 0.3;
        maxScore = Math.max(maxScore, score);
      }
    }
    
    return maxScore;
  }

  private calculateSentimentScore(userProfile: UserProfile, article: Article): number {
    if (userProfile.preferences.sentimentPreference === 'mixed') return 0;
    
    return article.sentiment === userProfile.preferences.sentimentPreference ? 10 : -5;
  }

  private calculateReadingTimeScore(userProfile: UserProfile, article: Article): number {
    const preferredTime = userProfile.preferences.readingTime;
    const articleTime = article.readTime || 1;
    
    const difference = Math.abs(preferredTime - articleTime);
    
    if (difference <= 1) return 10;
    if (difference <= 2) return 5;
    if (difference > 5) return -5;
    
    return 0;
  }

  private calculateCollaborativeScore(
    userProfile: UserProfile, 
    article: Article, 
    reasons: RecommendationReason[]
  ): number {
    // Simulation du filtrage collaboratif
    // Dans une vraie implémentation, cela analyserait le comportement d'utilisateurs similaires
    
    if (userProfile.similarUsers.length === 0) return 0;
    
    // Simuler que des utilisateurs similaires ont aimé cet article
    const similarityScore = Math.random() * 30; // Simulation
    
    if (similarityScore > 15) {
      reasons.push({
        type: 'similar_users',
        weight: similarityScore,
        description: 'Recommandé par des utilisateurs avec des goûts similaires',
        confidence: 65
      });
    }
    
    return similarityScore;
  }

  private calculateTrendingScore(article: Article, reasons: RecommendationReason[]): number {
    const trendingTopic = this.trendingTopics.find(topic => 
      topic.articles.includes(article.id) || 
      article.title.toLowerCase().includes(topic.topic.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(topic.topic.toLowerCase()))
    );
    
    if (trendingTopic) {
      const score = Math.min(25, trendingTopic.score * 0.5);
      reasons.push({
        type: 'trending',
        weight: score,
        description: `Sujet tendance: ${trendingTopic.topic}`,
        confidence: 85
      });
      return score;
    }
    
    return 0;
  }

  private calculateRecencyScore(article: Article, reasons: RecommendationReason[]): number {
    const now = new Date();
    const publishDate = new Date(article.publishDate);
    const hoursAgo = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
    
    let score = 0;
    if (hoursAgo <= 1) score = 15;
    else if (hoursAgo <= 6) score = 10;
    else if (hoursAgo <= 24) score = 5;
    
    if (score > 0) {
      reasons.push({
        type: 'trending',
        weight: score,
        description: 'Article récent',
        confidence: 90
      });
    }
    
    return score;
  }

  private calculateDiversityPenalty(userProfile: UserProfile, article: Article): number {
    // Pénaliser les articles trop similaires aux lectures récentes
    const recentArticles = userProfile.activityHistory
      .filter(activity => activity.action === 'complete_read')
      .slice(-10);
    
    const recentCategories = recentArticles.map(activity => {
      // En pratique, on récupérerait la catégorie de l'article depuis l'ID
      return 'category'; // Simplifié
    });
    
    const categoryCount = recentCategories.filter(cat => cat === article.category).length;
    
    return categoryCount * 5; // Pénalité pour manque de diversité
  }

  private determineRecommendationCategory(
    article: Article, 
    reasons: RecommendationReason[], 
    score: number
  ): string {
    const hasTrending = reasons.some(r => r.type === 'trending');
    const hasPersonalized = reasons.some(r => r.type === 'category' || r.type === 'topic');
    const hasSimilar = reasons.some(r => r.type === 'similar_users');
    
    if (article.isHot && hasTrending) return 'breaking';
    if (hasTrending && score > 70) return 'trending';
    if (hasPersonalized && score > 60) return 'for_you';
    if (hasSimilar && score > 50) return 'similar';
    if (article.readTime && article.readTime > 5) return 'deep_dive';
    
    return 'for_you';
  }

  private applyDiversification(
    scoredArticles: any[], 
    limit: number
  ): any[] {
    const result = [];
    const usedCategories = new Set<string>();
    const usedSources = new Set<string>();
    
    // Premier passage: prendre les meilleurs articles en garantissant la diversité
    for (const item of scoredArticles) {
      if (result.length >= limit) break;
      
      const categoryCount = Array.from(usedCategories).filter(c => c === item.article.category).length;
      const sourceCount = Array.from(usedSources).filter(s => s === item.article.source).length;
      
      // Limiter à 3 articles par catégorie et 2 par source
      if (categoryCount < 3 && sourceCount < 2) {
        result.push(item);
        usedCategories.add(item.article.category);
        usedSources.add(item.article.source);
      }
    }
    
    // Second passage: compléter si nécessaire
    for (const item of scoredArticles) {
      if (result.length >= limit) break;
      if (!result.includes(item)) {
        result.push(item);
      }
    }
    
    return result.slice(0, limit);
  }

  private updateTrendingTopics(articles: Article[]): void {
    // Analyser les trending topics basés sur les articles récents
    const topicCounts: { [topic: string]: number } = {};
    
    articles.forEach(article => {
      // Extraire les mots-clés significatifs
      const keywords = [...article.tags, ...article.title.split(' ')]
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase());
        
      keywords.forEach(keyword => {
        topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
      });
    });
    
    this.trendingTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({
        topic,
        score: count,
        articles: articles
          .filter(a => a.title.toLowerCase().includes(topic) || a.tags.includes(topic))
          .map(a => a.id),
        growth: Math.random() * 100, // Simulé
        timeframe: '24h' as const
      }));
  }

  private updateContentSimilarities(articles: Article[]): void {
    // Calculer les similarités entre articles
    for (let i = 0; i < articles.length; i++) {
      const similarities: ContentSimilarity[] = [];
      
      for (let j = i + 1; j < Math.min(articles.length, i + 20); j++) {
        const similarity = this.calculateContentSimilarity(articles[i], articles[j]);
        if (similarity.similarity > 30) {
          similarities.push(similarity);
        }
      }
      
      this.contentSimilarities.set(articles[i].id, similarities);
    }
  }

  private calculateContentSimilarity(article1: Article, article2: Article): ContentSimilarity {
    const keywords1 = new Set([...article1.tags, ...article1.title.toLowerCase().split(' ')]);
    const keywords2 = new Set([...article2.tags, ...article2.title.toLowerCase().split(' ')]);
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    const categorySimilarity = article1.category === article2.category ? 0.3 : 0;
    
    const totalSimilarity = (jaccardSimilarity * 0.7 + categorySimilarity) * 100;
    
    return {
      articleId1: article1.id,
      articleId2: article2.id,
      similarity: Math.round(totalSimilarity),
      sharedKeywords: Array.from(intersection),
      sharedCategories: article1.category === article2.category ? [article1.category] : []
    };
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        userId,
        favoriteCategories: ['Actualités'],
        preferredSources: [],
        readingTime: 5,
        topicsOfInterest: [],
        sentimentPreference: 'mixed',
        language: 'fr',
        lastUpdated: new Date().toISOString()
      },
      activityHistory: [],
      interests: [],
      behaviorMetrics: {
        avgReadingTime: 300,
        preferredTimeOfDay: 12,
        engagementScore: 50,
        diversityScore: 50
      },
      similarUsers: []
    };
  }

  public updateUserProfile(userId: string, activity: UserActivity): void {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = this.createDefaultProfile(userId);
    }
    
    // Ajouter l'activité
    profile.activityHistory.push(activity);
    
    // Limiter l'historique aux 100 dernières activités
    if (profile.activityHistory.length > 100) {
      profile.activityHistory = profile.activityHistory.slice(-100);
    }
    
    // Mettre à jour les métriques comportementales
    this.updateBehaviorMetrics(profile);
    
    // Mettre à jour les centres d'intérêt
    this.updateInterestProfile(profile, activity);
    
    this.userProfiles.set(userId, profile);
  }

  private updateBehaviorMetrics(profile: UserProfile): void {
    const recentActivities = profile.activityHistory.slice(-20);
    
    if (recentActivities.length === 0) return;
    
    // Calculer le temps moyen de lecture
    const readingActivities = recentActivities.filter(a => a.timeSpent > 0);
    if (readingActivities.length > 0) {
      profile.behaviorMetrics.avgReadingTime = 
        readingActivities.reduce((sum, a) => sum + a.timeSpent, 0) / readingActivities.length;
    }
    
    // Calculer le score d'engagement
    const engagementActions = recentActivities.filter(a => 
      ['like', 'share', 'save', 'complete_read'].includes(a.action)
    ).length;
    profile.behaviorMetrics.engagementScore = Math.min(100, engagementActions * 5);
  }

  private updateInterestProfile(profile: UserProfile, activity: UserActivity): void {
    // Simulation de mise à jour des intérêts
    // Dans une vraie implémentation, cela analyserait le contenu de l'article
    
    if (activity.action === 'complete_read' || activity.action === 'like') {
      const topic = 'général'; // Simplification
      let interest = profile.interests.find(i => i.topic === topic);
      
      if (!interest) {
        interest = {
          topic,
          strength: 10,
          trend: 'increasing',
          lastEngagement: activity.timestamp,
          keywords: []
        };
        profile.interests.push(interest);
      } else {
        interest.strength = Math.min(100, interest.strength + 5);
        interest.lastEngagement = activity.timestamp;
      }
    }
  }

  public getTrendingTopics(): TrendingTopics[] {
    return this.trendingTopics;
  }

  public switchEngine(engineName: string): boolean {
    const engine = RECOMMENDATION_ENGINES.find(e => e.name === engineName);
    if (engine) {
      this.currentEngine = engine;
      return true;
    }
    return false;
  }
}
