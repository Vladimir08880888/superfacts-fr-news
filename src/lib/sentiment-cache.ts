/**
 * Système de cache pour les analyses de sentiment
 * Améliore les performances en évitant de recalculer les sentiments déjà analysés
 */

export interface CachedSentiment {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  intensity?: 'low' | 'medium' | 'high';
  emotions?: string[];
  timestamp: number;
  articleId: string;
}

class SentimentCache {
  private cache: Map<string, CachedSentiment> = new Map();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  private readonly MAX_CACHE_SIZE = 10000; // Maximum 10k entrées en cache

  /**
   * Génère une clé de cache unique basée sur le contenu de l'article
   */
  private generateCacheKey(title: string, content: string): string {
    // Utilise un hash simple pour créer une clé unique
    const text = (title + content).toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Créer un hash simple compatible avec les caractères français
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 200); i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }
    
    // Convertir en string hexadécimal
    return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 16);
  }

  /**
   * Récupère un sentiment depuis le cache
   */
  get(articleId: string, title: string, content: string): CachedSentiment | null {
    const key = this.generateCacheKey(title, content);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Vérifier si le cache a expiré
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Sauvegarde un sentiment dans le cache
   */
  set(articleId: string, title: string, content: string, sentiment: Omit<CachedSentiment, 'timestamp' | 'articleId'>): void {
    const key = this.generateCacheKey(title, content);

    // Nettoyer le cache si il devient trop gros
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    const cachedSentiment: CachedSentiment = {
      ...sentiment,
      timestamp: Date.now(),
      articleId
    };

    this.cache.set(key, cachedSentiment);
  }

  /**
   * Nettoie les entrées expirées et les plus anciennes si nécessaire
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Supprimer les entrées expirées
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key);
      }
    });

    // Si encore trop d'entrées, supprimer les plus anciennes
    if (this.cache.size > this.MAX_CACHE_SIZE * 0.8) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, Math.floor(this.cache.size * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtient des statistiques sur le cache
   */
  getStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    if (this.cache.size === 0) {
      return { size: 0, hitRate: 0, oldestEntry: null, newestEntry: null };
    }

    const timestamps = Array.from(this.cache.values()).map(v => v.timestamp);
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);

    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Analyse par lot avec cache intelligent
   */
  analyzeBatch(articles: { id: string; title: string; content: string }[]): {
    cached: CachedSentiment[];
    toAnalyze: { id: string; title: string; content: string }[];
  } {
    const cached: CachedSentiment[] = [];
    const toAnalyze: { id: string; title: string; content: string }[] = [];

    articles.forEach(article => {
      const cachedResult = this.get(article.id, article.title, article.content);
      if (cachedResult) {
        cached.push(cachedResult);
        this.hitCount++;
      } else {
        toAnalyze.push(article);
        this.missCount++;
      }
    });

    return { cached, toAnalyze };
  }

  /**
   * Sauvegarde les résultats d'analyse par lot
   */
  setBatch(results: Array<{
    articleId: string;
    title: string;
    content: string;
    sentiment: Omit<CachedSentiment, 'timestamp' | 'articleId'>;
  }>): void {
    results.forEach(({ articleId, title, content, sentiment }) => {
      this.set(articleId, title, content, sentiment);
    });
  }

  // Compteurs pour calculer le hit rate
  private hitCount = 0;
  private missCount = 0;
}

// Instance singleton du cache
export const sentimentCache = new SentimentCache();

/**
 * Hook pour utiliser le cache de sentiment dans React
 */
export function useSentimentCache() {
  return {
    get: sentimentCache.get.bind(sentimentCache),
    set: sentimentCache.set.bind(sentimentCache),
    clear: sentimentCache.clear.bind(sentimentCache),
    getStats: sentimentCache.getStats.bind(sentimentCache),
    analyzeBatch: sentimentCache.analyzeBatch.bind(sentimentCache),
    setBatch: sentimentCache.setBatch.bind(sentimentCache)
  };
}

/**
 * Utilitaires pour la persistance du cache (localStorage)
 */
export class SentimentCachePersistence {
  private static readonly STORAGE_KEY = 'superfacts_sentiment_cache';
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Sauvegarde le cache dans localStorage
   */
  static save(): void {
    try {
      const stats = sentimentCache.getStats();
      const cacheData = {
        entries: Array.from(sentimentCache['cache'].entries()),
        stats,
        timestamp: Date.now()
      };

      const serialized = JSON.stringify(cacheData);
      
      // Vérifier la taille avant de sauvegarder
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('Cache trop volumineux pour localStorage, nettoyage nécessaire');
        sentimentCache['cleanup']();
        return this.save(); // Réessayer après nettoyage
      }

      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache:', error);
    }
  }

  /**
   * Charge le cache depuis localStorage
   */
  static load(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const cacheData = JSON.parse(stored);
      const now = Date.now();

      // Vérifier si le cache n'est pas trop ancien (7 jours max)
      if (now - cacheData.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      // Restaurer les entrées du cache
      cacheData.entries.forEach(([key, value]: [string, CachedSentiment]) => {
        // Vérifier si l'entrée n'a pas expiré
        if (now - value.timestamp < sentimentCache['CACHE_EXPIRY']) {
          sentimentCache['cache'].set(key, value);
        }
      });

      console.log(`Cache sentiment chargé: ${sentimentCache.getStats().size} entrées`);
    } catch (error) {
      console.error('Erreur lors du chargement du cache:', error);
      // Nettoyer le localStorage corrompu
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

// Auto-chargement du cache au démarrage
if (typeof window !== 'undefined') {
  SentimentCachePersistence.load();

  // Auto-sauvegarde périodique (toutes les 5 minutes)
  setInterval(() => {
    SentimentCachePersistence.save();
  }, 5 * 60 * 1000);

  // Sauvegarde lors de la fermeture de l'onglet
  window.addEventListener('beforeunload', () => {
    SentimentCachePersistence.save();
  });
}
