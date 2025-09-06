import { Article } from './news-collector';
import {
  PoliticalFigure,
  PoliticalEvent,
  PromiseTracking,
  MediaPresence,
  PoliticalInsight,
  PoliticalAnalytics,
  FRENCH_POLITICAL_FIGURES
} from '@/types/political-tracker';

export class PoliticalTracker {
  private figures: Map<string, PoliticalFigure> = new Map();
  private promises: Map<string, PromiseTracking> = new Map();
  private events: Map<string, PoliticalEvent> = new Map();
  private mediaPresence: Map<string, MediaPresence[]> = new Map();

  constructor() {
    // Initialiser avec les personnalités politiques françaises
    FRENCH_POLITICAL_FIGURES.forEach(figure => {
      this.figures.set(figure.id, figure);
    });

    // Créer quelques promesses de démonstration
    this.initializeDemoPromises();

    // Créer quelques événements de démonstration
    this.initializeDemoEvents();
  }

  private initializeDemoPromises(): void {
    const samplePromises: PromiseTracking[] = [
      {
        id: 'promise-1',
        politicalFigureId: 'macron-emmanuel',
        promise: 'Réduire le chômage en dessous de 7%',
        category: 'Économie',
        datePromised: '2022-04-01',
        deadline: '2027-05-01',
        status: 'in_progress',
        progress: 65,
        evidence: [
          {
            type: 'article',
            source: 'INSEE',
            date: '2025-01-15',
            description: 'Le taux de chômage est descendu à 7.2%',
            supportLevel: 'weak_support'
          }
        ],
        relatedArticles: [],
        lastUpdated: new Date().toISOString(),
        publicOpinion: {
          support: 45,
          opposition: 35,
          neutral: 20
        }
      },
      {
        id: 'promise-2',
        politicalFigureId: 'macron-emmanuel',
        promise: 'Atteindre la neutralité carbone en 2050',
        category: 'Environnement',
        datePromised: '2022-04-01',
        deadline: '2050-12-31',
        status: 'in_progress',
        progress: 25,
        evidence: [
          {
            type: 'action',
            source: 'Ministère de la Transition écologique',
            date: '2024-12-01',
            description: 'Lancement du plan France Nation Verte',
            supportLevel: 'weak_support'
          }
        ],
        relatedArticles: [],
        lastUpdated: new Date().toISOString(),
        publicOpinion: {
          support: 60,
          opposition: 25,
          neutral: 15
        }
      }
    ];

    samplePromises.forEach(promise => {
      this.promises.set(promise.id, promise);
    });
  }

  private initializeDemoEvents(): void {
    const sampleEvents: PoliticalEvent[] = [
      {
        id: 'event-1',
        title: 'Débat parlementaire sur la réforme des retraites',
        description: 'Débat à l\'Assemblée nationale concernant la réforme du système de retraites',
        date: '2025-09-15',
        type: 'debate',
        importance: 'high',
        participants: ['macron-emmanuel', 'melenchon-jean-luc', 'le-pen-marine'],
        location: 'Assemblée nationale',
        tags: ['retraites', 'réforme', 'débat'],
        relatedArticles: [],
        sentiment: 'negative'
      },
      {
        id: 'event-2',
        title: 'Élections municipales partielles',
        description: 'Élections municipales dans plusieurs communes françaises',
        date: '2025-10-12',
        type: 'election',
        importance: 'medium',
        participants: [],
        tags: ['élections', 'municipales'],
        relatedArticles: [],
        sentiment: 'neutral'
      }
    ];

    sampleEvents.forEach(event => {
      this.events.set(event.id, event);
    });
  }

  public analyzeArticles(articles: Article[]): PoliticalAnalytics {
    const figuresMentioned = new Map<string, { count: number; sentiment: number; articles: Article[] }>();
    const controversialTopics: { [topic: string]: { count: number; sentiments: number[] } } = {};

    // Analyser chaque article
    articles.forEach(article => {
      const mentions = this.detectPoliticalMentions(article);
      
      mentions.forEach(mention => {
        if (!figuresMentioned.has(mention.figureId)) {
          figuresMentioned.set(mention.figureId, { count: 0, sentiment: 0, articles: [] });
        }
        
        const data = figuresMentioned.get(mention.figureId)!;
        data.count++;
        data.sentiment += mention.sentiment;
        data.articles.push(article);
      });

      // Détecter les sujets controversiels
      const controversialKeywords = ['scandale', 'controverse', 'polémique', 'accusation', 'affaire'];
      if (controversialKeywords.some(keyword => 
        article.title.toLowerCase().includes(keyword) || 
        article.content.toLowerCase().includes(keyword)
      )) {
        const topic = this.extractMainTopic(article);
        if (!controversialTopics[topic]) {
          controversialTopics[topic] = { count: 0, sentiments: [] };
        }
        controversialTopics[topic].count++;
        controversialTopics[topic].sentiments.push(this.getSentimentScore(article.sentiment || 'neutral'));
      }
    });

    // Construire les top figures
    const topFigures = Array.from(figuresMentioned.entries())
      .map(([figureId, data]) => {
        const figure = this.figures.get(figureId);
        return {
          politicalFigureId: figureId,
          name: figure?.name || 'Inconnu',
          mentionCount: data.count,
          sentimentScore: data.count > 0 ? Math.round(data.sentiment / data.count) : 0,
          trend: this.calculateTrend(figureId, data.count) as 'rising' | 'stable' | 'falling'
        };
      })
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 10);

    // Analyser les promesses
    const promises = Array.from(this.promises.values());
    const activePromises = promises.filter(p => p.status === 'pending' || p.status === 'in_progress').length;
    const completedPromises = promises.filter(p => p.status === 'completed').length;
    const brokenPromises = promises.filter(p => p.status === 'broken').length;

    // Événements à venir
    const upcomingEvents = Array.from(this.events.values())
      .filter(event => new Date(event.date) > new Date()).length;

    // Top sujets controversiels
    const controversialTopicsArray = Object.entries(controversialTopics)
      .map(([topic, data]) => ({
        topic,
        articleCount: data.count,
        avgSentiment: data.sentiments.length > 0 
          ? Math.round(data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length)
          : 0
      }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 5);

    // Attention médiatique
    const mediaAttention = topFigures.slice(0, 5).map(figure => ({
      figure: figure.name,
      coverage: figure.mentionCount,
      change: Math.random() * 40 - 20 // Simulation du changement
    }));

    return {
      topFigures,
      activePromises,
      completedPromises,
      brokenPromises,
      upcomingEvents,
      controversialTopics: controversialTopicsArray,
      mediaAttention
    };
  }

  private detectPoliticalMentions(article: Article): { figureId: string; sentiment: number; confidence: number }[] {
    const mentions: { figureId: string; sentiment: number; confidence: number }[] = [];
    const text = `${article.title} ${article.content} ${article.summary}`.toLowerCase();

    this.figures.forEach(figure => {
      let mentionCount = 0;
      let maxConfidence = 0;

      // Vérifier les différents alias et mots-clés
      const allKeywords = [...figure.aliases, ...figure.keywords];
      
      for (const keyword of allKeywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          mentionCount += matches.length;
          // Calculer la confiance basée sur la spécificité du mot-clé
          const confidence = keyword === figure.name ? 100 : 
                          figure.aliases.includes(keyword) ? 90 :
                          80;
          maxConfidence = Math.max(maxConfidence, confidence);
        }
      }

      if (mentionCount > 0) {
        mentions.push({
          figureId: figure.id,
          sentiment: this.getSentimentScore(article.sentiment || 'neutral'),
          confidence: maxConfidence
        });
      }
    });

    return mentions;
  }

  private getSentimentScore(sentiment: 'positive' | 'negative' | 'neutral'): number {
    switch (sentiment) {
      case 'positive': return 50;
      case 'negative': return -50;
      default: return 0;
    }
  }

  private extractMainTopic(article: Article): string {
    // Simplifié : utilise la catégorie ou le premier tag
    return article.category || article.tags[0] || 'Divers';
  }

  private calculateTrend(figureId: string, currentCount: number): string {
    // Simulation de calcul de tendance
    // Dans une vraie implémentation, on comparerait avec les données précédentes
    const random = Math.random();
    if (currentCount > 10) {
      return random > 0.6 ? 'rising' : random > 0.3 ? 'stable' : 'falling';
    }
    return 'stable';
  }

  public getMediaPresence(figureId: string, period?: string): MediaPresence | null {
    const currentPeriod = period || new Date().toISOString().substring(0, 7); // YYYY-MM
    const presence = this.mediaPresence.get(figureId);
    
    if (!presence) return null;
    
    return presence.find(p => p.period === currentPeriod) || null;
  }

  public updateMediaPresence(articles: Article[]): void {
    const currentPeriod = new Date().toISOString().substring(0, 7);
    
    this.figures.forEach(figure => {
      const relevantArticles = articles.filter(article => {
        const mentions = this.detectPoliticalMentions(article);
        return mentions.some(mention => mention.figureId === figure.id);
      });

      if (relevantArticles.length > 0) {
        const mentionCount = relevantArticles.length;
        const sentimentScore = relevantArticles.reduce((sum, article) => {
          return sum + this.getSentimentScore(article.sentiment || 'neutral');
        }, 0) / relevantArticles.length;

        const topArticles = relevantArticles
          .slice(0, 5)
          .map(article => ({
            articleId: article.id,
            title: article.title,
            sentiment: article.sentiment || 'neutral' as const,
            date: article.publishDate,
            source: article.source
          }));

        const keywords = this.extractKeywordsFromArticles(relevantArticles);
        
        const mediaPresence: MediaPresence = {
          politicalFigureId: figure.id,
          period: currentPeriod,
          mentionCount,
          sentimentScore: Math.round(sentimentScore),
          topArticles,
          keywords,
          trend: this.calculateTrend(figure.id, mentionCount) as any
        };

        if (!this.mediaPresence.has(figure.id)) {
          this.mediaPresence.set(figure.id, []);
        }

        const presenceArray = this.mediaPresence.get(figure.id)!;
        const existingIndex = presenceArray.findIndex(p => p.period === currentPeriod);
        
        if (existingIndex >= 0) {
          presenceArray[existingIndex] = mediaPresence;
        } else {
          presenceArray.push(mediaPresence);
        }
      }
    });
  }

  private extractKeywordsFromArticles(articles: Article[]): { word: string; count: number }[] {
    const wordCount: { [word: string]: number } = {};
    
    articles.forEach(article => {
      const text = `${article.title} ${article.content}`.toLowerCase();
      const words = text.split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !/^\d+$/.test(word)); // Exclure les nombres
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  public generateInsights(articles: Article[]): PoliticalInsight[] {
    const insights: PoliticalInsight[] = [];

    // Insight sur les tendances
    const analytics = this.analyzeArticles(articles);
    
    if (analytics.topFigures.length > 0) {
      const topFigure = analytics.topFigures[0];
      insights.push({
        type: 'trend',
        title: `${topFigure.name} domine l'actualité politique`,
        description: `Avec ${topFigure.mentionCount} mentions récentes, ${topFigure.name} est la personnalité politique la plus présente dans les médias.`,
        confidence: 85,
        relevantFigures: [topFigure.politicalFigureId],
        dataPoints: [{ mentions: topFigure.mentionCount, sentiment: topFigure.sentimentScore }],
        generatedAt: new Date().toISOString(),
        importance: 'high'
      });
    }

    // Insight sur les controverses
    if (analytics.controversialTopics.length > 0) {
      const topControversy = analytics.controversialTopics[0];
      insights.push({
        type: 'controversy',
        title: `Controverse autour de ${topControversy.topic}`,
        description: `Le sujet "${topControversy.topic}" génère une forte controverse avec ${topControversy.articleCount} articles récents.`,
        confidence: 75,
        relevantFigures: [],
        dataPoints: [{ topic: topControversy.topic, articles: topControversy.articleCount }],
        generatedAt: new Date().toISOString(),
        importance: 'medium'
      });
    }

    // Insight sur les promesses
    const promises = Array.from(this.promises.values());
    const recentlyUpdatedPromises = promises.filter(p => {
      const daysSinceUpdate = (Date.now() - new Date(p.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });

    if (recentlyUpdatedPromises.length > 0) {
      const promise = recentlyUpdatedPromises[0];
      const figure = this.figures.get(promise.politicalFigureId);
      
      insights.push({
        type: 'promise_update',
        title: `Mise à jour sur une promesse de ${figure?.name}`,
        description: `La promesse "${promise.promise}" a été mise à jour avec un progrès de ${promise.progress}%.`,
        confidence: 90,
        relevantFigures: [promise.politicalFigureId],
        dataPoints: [{ progress: promise.progress, status: promise.status }],
        generatedAt: new Date().toISOString(),
        importance: promise.progress > 80 ? 'high' : 'medium'
      });
    }

    return insights;
  }

  public getPromisesByFigure(figureId: string): PromiseTracking[] {
    return Array.from(this.promises.values())
      .filter(promise => promise.politicalFigureId === figureId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  public getUpcomingEvents(limit: number = 5): PoliticalEvent[] {
    return Array.from(this.events.values())
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }

  public getPoliticalFigures(): PoliticalFigure[] {
    return Array.from(this.figures.values());
  }

  public getPoliticalFigure(id: string): PoliticalFigure | undefined {
    return this.figures.get(id);
  }

  public addPromise(promise: PromiseTracking): void {
    this.promises.set(promise.id, promise);
  }

  public updatePromise(id: string, updates: Partial<PromiseTracking>): boolean {
    const promise = this.promises.get(id);
    if (promise) {
      this.promises.set(id, { ...promise, ...updates, lastUpdated: new Date().toISOString() });
      return true;
    }
    return false;
  }

  public addEvent(event: PoliticalEvent): void {
    this.events.set(event.id, event);
  }
}
