import { Article } from './news-collector';
import { kv } from '@vercel/kv';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface DatabaseAdapter {
  getArticles(): Promise<Article[]>;
  saveArticles(articles: Article[]): Promise<void>;
  isAvailable(): Promise<boolean>;
}

class VercelKVAdapter implements DatabaseAdapter {
  private readonly ARTICLES_KEY = 'superfacts:articles';

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем наличие переменных окружения KV
      if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.log('Vercel KV переменные окружения отсутствуют');
        return false;
      }
      
      // Проверяем доступность KV с помощью простого ping
      await kv.ping();
      return true;
    } catch (error) {
      console.log('Vercel KV недоступен:', error);
      return false;
    }
  }

  async getArticles(): Promise<Article[]> {
    try {
      const articles = await kv.get<Article[]>(this.ARTICLES_KEY);
      return articles || [];
    } catch (error) {
      console.error('Ошибка получения статей из KV:', error);
      return [];
    }
  }

  async saveArticles(articles: Article[]): Promise<void> {
    try {
      // Сохраняем только последние 1000 статей
      const limitedArticles = articles.slice(0, 1000);
      await kv.set(this.ARTICLES_KEY, limitedArticles);
      console.log(`✅ Сохранено ${limitedArticles.length} статей в Vercel KV`);
    } catch (error) {
      console.error('Ошибка сохранения статей в KV:', error);
      throw error;
    }
  }
}

class FileSystemAdapter implements DatabaseAdapter {
  private articlesDir: string;
  private articlesPath: string;

  constructor() {
    this.articlesDir = path.join(process.cwd(), 'data');
    this.articlesPath = path.join(this.articlesDir, 'articles.json');
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем возможность записи файла
      await this.ensureDataDir();
      const testPath = path.join(this.articlesDir, 'test-write');
      await writeFile(testPath, 'test');
      require('fs').unlinkSync(testPath);
      return true;
    } catch (error) {
      console.log('Файловая система недоступна для записи:', error);
      return false;
    }
  }

  private async ensureDataDir() {
    if (!existsSync(this.articlesDir)) {
      await mkdir(this.articlesDir, { recursive: true });
    }
  }

  async getArticles(): Promise<Article[]> {
    try {
      const data = await readFile(this.articlesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('📝 Файл статей не найден или пуст, создается новый...');
      return [];
    }
  }

  async saveArticles(articles: Article[]): Promise<void> {
    try {
      await this.ensureDataDir();
      const limitedArticles = articles.slice(0, 1000);
      await writeFile(this.articlesPath, JSON.stringify(limitedArticles, null, 2), 'utf8');
      console.log(`✅ Сохранено ${limitedArticles.length} статей в файловую систему`);
    } catch (error) {
      console.error('Ошибка сохранения статей в файл:', error);
      throw error;
    }
  }
}

class InMemoryAdapter implements DatabaseAdapter {
  private articles: Article[] = [];

  async isAvailable(): Promise<boolean> {
    return true; // Всегда доступен
  }

  async getArticles(): Promise<Article[]> {
    console.log('⚠️  Используется временное хранение в памяти');
    return [...this.articles];
  }

  async saveArticles(articles: Article[]): Promise<void> {
    this.articles = articles.slice(0, 1000);
    console.log(`⚠️  Сохранено ${this.articles.length} статей во временную память (данные потеряются при перезапуске)`);
  }
}

export class DatabaseManager {
  private adapter: DatabaseAdapter | null = null;
  private adaptationInProgress = false;

  async getAdapter(): Promise<DatabaseAdapter> {
    if (this.adapter && !this.adaptationInProgress) {
      return this.adapter;
    }

    // Предотвращаем множественные попытки адаптации
    if (this.adaptationInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.adapter || new InMemoryAdapter();
    }

    this.adaptationInProgress = true;

    try {
      // Пытаемся подключить адаптеры в порядке приоритета для Vercel
      const adapters: { name: string; adapter: DatabaseAdapter }[] = [];
      
      // В продакшене Vercel сначала пробуем KV, потом In Memory
      if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
        adapters.push(
          { name: 'Vercel KV', adapter: new VercelKVAdapter() },
          { name: 'In Memory (Production)', adapter: new InMemoryAdapter() }
        );
      } else {
        // В разработке пробуем File System, затем остальные
        adapters.push(
          { name: 'File System', adapter: new FileSystemAdapter() },
          { name: 'Vercel KV', adapter: new VercelKVAdapter() },
          { name: 'In Memory', adapter: new InMemoryAdapter() }
        );
      }

      for (const { name, adapter } of adapters) {
        try {
          const isAvailable = await Promise.race([
            adapter.isAvailable(),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
          ]);
          
          if (isAvailable) {
            console.log(`🗄️  Используется адаптер: ${name}`);
            this.adapter = adapter;
            return adapter;
          }
        } catch (error) {
          console.log(`❌ Адаптер ${name} недоступен:`, error);
        }
      }

      // Fallback на in-memory если все остальное не работает
      console.log('🗄️  Используется fallback адаптер: In Memory (все остальные недоступны)');
      this.adapter = new InMemoryAdapter();
      return this.adapter;
    } finally {
      this.adaptationInProgress = false;
    }
  }

  async getArticles(): Promise<Article[]> {
    const adapter = await this.getAdapter();
    return adapter.getArticles();
  }

  async saveArticles(articles: Article[]): Promise<void> {
    const adapter = await this.getAdapter();
    return adapter.saveArticles(articles);
  }

  async getAdapterInfo(): Promise<{ name: string; available: boolean; environment: any }> {
    const adapters = [
      { name: 'Vercel KV', adapter: new VercelKVAdapter() },
      { name: 'File System', adapter: new FileSystemAdapter() },
      { name: 'In Memory', adapter: new InMemoryAdapter() }
    ];

    const results = [];
    for (const { name, adapter } of adapters) {
      try {
        const available = await adapter.isAvailable();
        results.push({ name, available });
      } catch (error) {
        results.push({ name, available: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      name: this.adapter ? this.adapter.constructor.name : 'None',
      available: !!this.adapter,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'NOT_SET',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT_SET',
        adapters: results
      }
    };
  }

  async forceRefreshAdapter(): Promise<void> {
    this.adapter = null;
    this.adaptationInProgress = false;
    await this.getAdapter();
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
