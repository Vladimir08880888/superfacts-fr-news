export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiry: number;
  size: number; // размер в байтах
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

export interface CacheConfig {
  defaultTTL: number; // время жизни по умолчанию в секундах
  maxMemorySize: number; // максимальный размер в байтах
  maxLocalStorageSize: number;
  cleanupInterval: number; // интервал очистки в секундах
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  localStorageUsage: number;
  hitRate: number;
  missRate: number;
  avgAccessTime: number;
  topKeys: { key: string; hits: number }[];
}

export class CacheSystem {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 3600, // 1 heure
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxLocalStorageSize: 10 * 1024 * 1024, // 10MB
      cleanupInterval: 300, // 5 minutes
      ...config
    };

    this.startCleanupTimer();
    this.loadFromLocalStorage();
  }

  // Cache principal
  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Vérifier d'abord le cache mémoire
      let entry = this.memoryCache.get(key);
      
      // Si pas en mémoire, vérifier localStorage
      if (!entry) {
        entry = this.getFromLocalStorage<T>(key);
        if (entry) {
          // Remettre en cache mémoire si trouvé dans localStorage
          this.memoryCache.set(key, entry);
        }
      }

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Vérifier l'expiration
      if (Date.now() > entry.expiry) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Mettre à jour les statistiques d'accès
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hits++;

      return entry.data as T;
    } finally {
      const accessTime = performance.now() - startTime;
      this.stats.totalAccessTime += accessTime;
      this.stats.accessCount++;
    }
  }

  public async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    tags: string[] = []
  ): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const expiry = timestamp + ((ttl || this.config.defaultTTL) * 1000);
      const size = this.estimateSize(data);

      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp,
        expiry,
        size,
        accessCount: 0,
        lastAccessed: timestamp,
        tags
      };

      // Vérifier si on peut stocker en mémoire
      if (this.canStoreInMemory(size)) {
        this.memoryCache.set(key, entry);
      }

      // Toujours essayer de stocker dans localStorage pour la persistance
      this.setInLocalStorage(key, entry);

      // Nettoyer si nécessaire
      await this.cleanup();

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  public delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    this.removeFromLocalStorage(key);
    return deleted;
  }

  public clear(): void {
    this.memoryCache.clear();
    this.clearLocalStorage();
  }

  // Cache spécialisé pour les API
  public async cacheAPIResponse<T>(
    endpoint: string,
    params: Record<string, any>,
    data: T,
    ttl: number = 1800 // 30 minutes
  ): Promise<void> {
    const key = this.generateAPIKey(endpoint, params);
    await this.set(key, {
      data,
      timestamp: Date.now(),
      endpoint,
      params
    }, ttl, ['api', endpoint.split('/')[1]]);
  }

  public async getAPIResponse<T>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<T | null> {
    const key = this.generateAPIKey(endpoint, params);
    const cached = await this.get<{ data: T; timestamp: number }>(key);
    return cached ? cached.data : null;
  }

  // Cache spécialisé pour les traductions
  public async cacheTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    translation: string,
    ttl: number = 86400 // 24 heures
  ): Promise<void> {
    const key = this.generateTranslationKey(text, sourceLang, targetLang);
    await this.set(key, translation, ttl, ['translation', targetLang]);
  }

  public async getTranslation(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    const key = this.generateTranslationKey(text, sourceLang, targetLang);
    return await this.get<string>(key);
  }

  // Cache spécialisé pour les recommandations
  public async cacheRecommendations<T>(
    userId: string,
    preferences: Record<string, any>,
    recommendations: T,
    ttl: number = 3600 // 1 heure
  ): Promise<void> {
    const key = this.generateRecommendationKey(userId, preferences);
    await this.set(key, {
      recommendations,
      preferences,
      generated: Date.now()
    }, ttl, ['recommendations', userId]);
  }

  public async getRecommendations<T>(
    userId: string,
    preferences: Record<string, any>
  ): Promise<T | null> {
    const key = this.generateRecommendationKey(userId, preferences);
    const cached = await this.get<{ recommendations: T; preferences: Record<string, any> }>(key);
    return cached ? cached.recommendations : null;
  }

  // Cache spécialisé pour RSS parsing
  public async cacheRSSFeed<T>(
    feedUrl: string,
    data: T,
    ttl: number = 1800 // 30 minutes
  ): Promise<void> {
    const key = `rss:${this.hashString(feedUrl)}`;
    await this.set(key, {
      data,
      url: feedUrl,
      fetched: Date.now()
    }, ttl, ['rss', 'feeds']);
  }

  public async getRSSFeed<T>(feedUrl: string): Promise<T | null> {
    const key = `rss:${this.hashString(feedUrl)}`;
    const cached = await this.get<{ data: T; url: string }>(key);
    return cached ? cached.data : null;
  }

  // Cache par tags
  public async invalidateByTag(tag: string): Promise<number> {
    let invalidated = 0;
    
    // Invalider en mémoire
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }

    // Invalider dans localStorage
    const keys = this.getLocalStorageKeys();
    for (const key of keys) {
      const entry = this.getFromLocalStorage(key);
      if (entry && entry.tags.includes(tag)) {
        this.removeFromLocalStorage(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // Preloading et prefetching
  public async preload<T>(key: string, dataFetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const data = await dataFetcher();
    await this.set(key, data, ttl);
    return data;
  }

  public async prefetch<T>(key: string, dataFetcher: () => Promise<T>, ttl?: number): Promise<void> {
    // Prefetch en arrière-plan sans bloquer
    setTimeout(async () => {
      try {
        const cached = await this.get<T>(key);
        if (!cached) {
          const data = await dataFetcher();
          await this.set(key, data, ttl);
        }
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }, 0);
  }

  // Compression et optimisation
  public async compress(): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // Trier par fréquence d'accès et récence
    entries.sort(([, a], [, b]) => {
      const scoreA = (a.accessCount * 0.7) + ((Date.now() - a.lastAccessed) / 1000 * -0.3);
      const scoreB = (b.accessCount * 0.7) + ((Date.now() - b.lastAccessed) / 1000 * -0.3);
      return scoreB - scoreA;
    });

    // Garder seulement les entries les plus importantes
    const maxEntries = Math.floor(this.memoryCache.size * 0.8);
    const toKeep = entries.slice(0, maxEntries);
    
    this.memoryCache.clear();
    for (const [key, entry] of toKeep) {
      this.memoryCache.set(key, entry);
    }
  }

  // Statistiques et monitoring
  public getStats(): CacheStats {
    const memoryEntries = Array.from(this.memoryCache.values());
    const memoryUsage = memoryEntries.reduce((sum, entry) => sum + entry.size, 0);
    
    const totalAccesses = this.stats.hits + this.stats.misses;
    const hitRate = totalAccesses > 0 ? (this.stats.hits / totalAccesses) * 100 : 0;
    const missRate = totalAccesses > 0 ? (this.stats.misses / totalAccesses) * 100 : 0;
    
    const avgAccessTime = this.stats.accessCount > 0 
      ? this.stats.totalAccessTime / this.stats.accessCount 
      : 0;

    // Top keys par hits
    const topKeys = memoryEntries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(entry => ({ key: entry.key, hits: entry.accessCount }));

    return {
      totalEntries: this.memoryCache.size + this.getLocalStorageKeys().length,
      memoryUsage,
      localStorageUsage: this.getLocalStorageSize(),
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      avgAccessTime: Math.round(avgAccessTime * 100) / 100,
      topKeys
    };
  }

  // Nettoyage et maintenance
  private async cleanup(): Promise<void> {
    const now = Date.now();
    
    // Nettoyer les entrées expirées en mémoire
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiry) {
        this.memoryCache.delete(key);
      }
    }

    // Nettoyer localStorage
    this.cleanupLocalStorage();
    
    // Vérifier les limites de taille
    await this.enforceSizeLimits();
  }

  private async enforceSizeLimits(): Promise<void> {
    // Limite mémoire
    const memoryUsage = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    if (memoryUsage > this.config.maxMemorySize) {
      await this.evictFromMemory(memoryUsage - this.config.maxMemorySize);
    }

    // Limite localStorage
    const localStorageUsage = this.getLocalStorageSize();
    if (localStorageUsage > this.config.maxLocalStorageSize) {
      this.evictFromLocalStorage(localStorageUsage - this.config.maxLocalStorageSize);
    }
  }

  private async evictFromMemory(bytesToEvict: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // Trier par LRU (Least Recently Used)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let evicted = 0;
    for (const [key, entry] of entries) {
      this.memoryCache.delete(key);
      evicted += entry.size;
      
      if (evicted >= bytesToEvict) {
        break;
      }
    }
  }

  // Gestion localStorage
  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (!stored) return null;
      
      const entry = JSON.parse(stored) as CacheEntry<T>;
      
      // Vérifier l'expiration
      if (Date.now() > entry.expiry) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return entry;
    } catch {
      return null;
    }
  }

  private setInLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      // Si localStorage est plein, nettoyer et réessayer
      this.evictFromLocalStorage(entry.size * 2);
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      } catch {
        console.warn('Cannot store in localStorage, cache full');
      }
    }
  }

  private removeFromLocalStorage(key: string): void {
    localStorage.removeItem(`cache:${key}`);
  }

  private getLocalStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        keys.push(key.substring(6)); // Remove 'cache:' prefix
      }
    }
    return keys;
  }

  private getLocalStorageSize(): number {
    let size = 0;
    const keys = this.getLocalStorageKeys();
    
    for (const key of keys) {
      const item = localStorage.getItem(`cache:${key}`);
      if (item) {
        size += item.length * 2; // UTF-16 encoding
      }
    }
    
    return size;
  }

  private cleanupLocalStorage(): void {
    const keys = this.getLocalStorageKeys();
    const now = Date.now();
    
    for (const key of keys) {
      const entry = this.getFromLocalStorage(key);
      if (!entry || now > entry.expiry) {
        this.removeFromLocalStorage(key);
      }
    }
  }

  private evictFromLocalStorage(bytesToEvict: number): void {
    const keys = this.getLocalStorageKeys();
    const entries = keys
      .map(key => ({ key, entry: this.getFromLocalStorage(key) }))
      .filter(({ entry }) => entry !== null)
      .sort((a, b) => a.entry!.lastAccessed - b.entry!.lastAccessed);
    
    let evicted = 0;
    for (const { key, entry } of entries) {
      this.removeFromLocalStorage(key);
      evicted += entry!.size;
      
      if (evicted >= bytesToEvict) {
        break;
      }
    }
  }

  private clearLocalStorage(): void {
    const keys = this.getLocalStorageKeys();
    for (const key of keys) {
      this.removeFromLocalStorage(key);
    }
  }

  private loadFromLocalStorage(): void {
    // Charger les entrées critiques depuis localStorage vers mémoire
    const keys = this.getLocalStorageKeys();
    const criticalTags = ['user', 'config', 'preferences'];
    
    for (const key of keys) {
      const entry = this.getFromLocalStorage(key);
      if (entry && entry.tags.some(tag => criticalTags.includes(tag))) {
        if (this.canStoreInMemory(entry.size)) {
          this.memoryCache.set(key, entry);
        }
      }
    }
  }

  // Utilitaires
  private canStoreInMemory(size: number): boolean {
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return (currentSize + size) <= this.config.maxMemorySize;
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 approximation
    } catch {
      return 1024; // Default size
    }
  }

  private generateAPIKey(endpoint: string, params: Record<string, any>): string {
    const paramsStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `api:${endpoint}:${this.hashString(paramsStr)}`;
  }

  private generateTranslationKey(text: string, sourceLang: string, targetLang: string): string {
    return `trans:${sourceLang}:${targetLang}:${this.hashString(text)}`;
  }

  private generateRecommendationKey(userId: string, preferences: Record<string, any>): string {
    const prefStr = JSON.stringify(preferences);
    return `rec:${userId}:${this.hashString(prefStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 1000);
  }

  // Cleanup des ressources
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.memoryCache.clear();
  }
}

// Configuration par défaut
const defaultCacheConfig: CacheConfig = {
  defaultTTL: 3600,
  maxMemorySize: 50 * 1024 * 1024,
  maxLocalStorageSize: 10 * 1024 * 1024,
  cleanupInterval: 300
};

// Instance singleton
export const cacheSystem = new CacheSystem(defaultCacheConfig);
