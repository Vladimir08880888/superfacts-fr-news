import { kv } from '@vercel/kv';

// Types for our KV operations
export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface TranslationCacheEntry {
  text: string;
  language: string;
  translation: string;
  timestamp: number;
}

export class KVService {
  private static readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Set a value in KV with optional TTL
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
      };
      
      await kv.set(key, JSON.stringify(entry), { ex: ttl });
    } catch (error) {
      console.error('KV set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from KV
   */
  static async get(key: string): Promise<any | null> {
    try {
      const result = await kv.get(key);
      
      if (!result) {
        return null;
      }

      let entry: CacheEntry;
      
      try {
        entry = typeof result === 'string' ? JSON.parse(result) : result;
      } catch {
        // If parsing fails, return the raw result
        return result;
      }

      // Check if entry has expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  /**
   * Delete a key from KV
   */
  static async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error('KV delete error:', error);
    }
  }

  /**
   * Check if a key exists in KV
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await kv.exists(key);
      return result === 1;
    } catch (error) {
      console.error('KV exists error:', error);
      return false;
    }
  }

  /**
   * Set translation cache
   */
  static async setTranslation(
    originalText: string, 
    targetLanguage: string, 
    translation: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getTranslationKey(originalText, targetLanguage);
    const entry: TranslationCacheEntry = {
      text: originalText,
      language: targetLanguage,
      translation,
      timestamp: Date.now(),
    };
    
    await this.set(key, entry, ttl);
  }

  /**
   * Get translation from cache
   */
  static async getTranslation(originalText: string, targetLanguage: string): Promise<string | null> {
    const key = this.getTranslationKey(originalText, targetLanguage);
    const entry = await this.get(key);
    
    if (entry && entry.translation) {
      return entry.translation;
    }
    
    return null;
  }

  /**
   * Generate translation cache key
   */
  private static getTranslationKey(text: string, language: string): string {
    // Create a hash of the text for consistent key generation
    const textHash = Buffer.from(text).toString('base64').slice(0, 50);
    return `translation:${language}:${textHash}`;
  }

  /**
   * Get all keys matching a pattern
   */
  static async getKeys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys = await kv.keys(pattern);
      return keys || [];
    } catch (error) {
      console.error('KV keys error:', error);
      return [];
    }
  }

  /**
   * Clear all translation cache
   */
  static async clearTranslationCache(): Promise<void> {
    try {
      const keys = await this.getKeys('translation:*');
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } catch (error) {
      console.error('KV clear translation cache error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{ totalKeys: number; translationKeys: number }> {
    try {
      const allKeys = await this.getKeys('*');
      const translationKeys = await this.getKeys('translation:*');
      
      return {
        totalKeys: allKeys.length,
        translationKeys: translationKeys.length,
      };
    } catch (error) {
      console.error('KV stats error:', error);
      return { totalKeys: 0, translationKeys: 0 };
    }
  }

  /**
   * Health check for KV connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health-check';
      const testValue = 'ok';
      
      await this.set(testKey, testValue, 10); // 10 seconds TTL
      const result = await this.get(testKey);
      await this.delete(testKey);
      
      return result === testValue;
    } catch (error) {
      console.error('KV health check failed:', error);
      return false;
    }
  }
}

// Export default instance
export default KVService;
