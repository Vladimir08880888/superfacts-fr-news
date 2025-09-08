import { ApiKey, ApiPermission, ApiUsage, RateLimitStatus, DEFAULT_API_PERMISSIONS } from '@/types/api';
import crypto from 'crypto';

export class ApiKeyManager {
  private apiKeys: Map<string, ApiKey> = new Map();
  private usage: Map<string, ApiUsage[]> = new Map();
  private rateLimitWindows: Map<string, { [window: string]: number }> = new Map();

  constructor() {
    // Créer quelques API keys de démo
    this.createDemoKeys();
  }

  private createDemoKeys(): void {
    // API Key de démonstration
    const demoKey = this.generateApiKey(
      'demo-user',
      'Demo API Key',
      DEFAULT_API_PERMISSIONS,
      {
        requestsPerMinute: 30,
        requestsPerHour: 1000,
        requestsPerDay: 5000
      }
    );
    this.apiKeys.set(demoKey.key, demoKey);

  }

  public generateApiKey(
    userId: string,
    name: string,
    permissions: ApiPermission[] = DEFAULT_API_PERMISSIONS,
    rateLimit = {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 5000
    },
    expiresAt?: string
  ): ApiKey {
    const key = 'sf_' + crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();

    const apiKey: ApiKey = {
      id,
      key,
      name,
      userId,
      permissions,
      rateLimit,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    return apiKey;
  }

  public validateApiKey(key: string): { isValid: boolean; apiKey?: ApiKey; error?: string } {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) {
      return { isValid: false, error: 'API key non trouvée' };
    }

    if (!apiKey.isActive) {
      return { isValid: false, error: 'API key désactivée' };
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { isValid: false, error: 'API key expirée' };
    }

    return { isValid: true, apiKey };
  }

  public checkPermissions(
    apiKey: ApiKey,
    resource: string,
    action: string,
    constraints?: any
  ): { hasPermission: boolean; error?: string } {
    const permission = apiKey.permissions.find(p => p.resource === resource);

    if (!permission) {
      return { hasPermission: false, error: `Permission manquante pour la ressource ${resource}` };
    }

    if (!permission.actions.includes(action as any)) {
      return { hasPermission: false, error: `Action ${action} non autorisée pour ${resource}` };
    }

    // Vérifier les contraintes
    if (permission.constraints && constraints) {
      if (permission.constraints.maxResults && constraints.limit > permission.constraints.maxResults) {
        return { 
          hasPermission: false, 
          error: `Limite de résultats dépassée (max: ${permission.constraints.maxResults})` 
        };
      }

      if (permission.constraints.categories && constraints.category) {
        if (!permission.constraints.categories.includes(constraints.category)) {
          return { 
            hasPermission: false, 
            error: `Catégorie ${constraints.category} non autorisée` 
          };
        }
      }

      if (permission.constraints.sources && constraints.source) {
        if (!permission.constraints.sources.includes(constraints.source)) {
          return { 
            hasPermission: false, 
            error: `Source ${constraints.source} non autorisée` 
          };
        }
      }
    }

    return { hasPermission: true };
  }

  public checkRateLimit(apiKey: ApiKey): { 
    allowed: boolean; 
    rateLimitStatus: RateLimitStatus; 
    error?: string 
  } {
    const now = new Date();
    const keyId = apiKey.id;

    // Initialiser les fenêtres de rate limiting si nécessaire
    if (!this.rateLimitWindows.has(keyId)) {
      this.rateLimitWindows.set(keyId, {
        minute: 0,
        hour: 0,
        day: 0,
        lastMinuteReset: now.getTime(),
        lastHourReset: now.getTime(),
        lastDayReset: now.getTime()
      });
    }

    const windows = this.rateLimitWindows.get(keyId)!;

    // Reset des compteurs si nécessaire
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (now.getTime() - windows.lastMinuteReset >= minuteMs) {
      windows.minute = 0;
      windows.lastMinuteReset = now.getTime();
    }

    if (now.getTime() - windows.lastHourReset >= hourMs) {
      windows.hour = 0;
      windows.lastHourReset = now.getTime();
    }

    if (now.getTime() - windows.lastDayReset >= dayMs) {
      windows.day = 0;
      windows.lastDayReset = now.getTime();
    }

    // Vérifier les limites
    if (windows.minute >= apiKey.rateLimit.requestsPerMinute) {
      const resetTime = new Date(windows.lastMinuteReset + minuteMs);
      return {
        allowed: false,
        rateLimitStatus: {
          limit: apiKey.rateLimit.requestsPerMinute,
          remaining: 0,
          resetTime: resetTime.toISOString(),
          windowType: 'minute'
        },
        error: 'Rate limit par minute dépassé'
      };
    }

    if (windows.hour >= apiKey.rateLimit.requestsPerHour) {
      const resetTime = new Date(windows.lastHourReset + hourMs);
      return {
        allowed: false,
        rateLimitStatus: {
          limit: apiKey.rateLimit.requestsPerHour,
          remaining: 0,
          resetTime: resetTime.toISOString(),
          windowType: 'hour'
        },
        error: 'Rate limit par heure dépassé'
      };
    }

    if (windows.day >= apiKey.rateLimit.requestsPerDay) {
      const resetTime = new Date(windows.lastDayReset + dayMs);
      return {
        allowed: false,
        rateLimitStatus: {
          limit: apiKey.rateLimit.requestsPerDay,
          remaining: 0,
          resetTime: resetTime.toISOString(),
          windowType: 'day'
        },
        error: 'Rate limit par jour dépassé'
      };
    }

    // Incrémenter les compteurs
    windows.minute++;
    windows.hour++;
    windows.day++;

    return {
      allowed: true,
      rateLimitStatus: {
        limit: apiKey.rateLimit.requestsPerMinute,
        remaining: apiKey.rateLimit.requestsPerMinute - windows.minute,
        resetTime: new Date(windows.lastMinuteReset + minuteMs).toISOString(),
        windowType: 'minute'
      }
    };
  }

  public logUsage(
    apiKey: ApiKey,
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    requestSize: number,
    responseSize: number,
    userAgent?: string,
    ip?: string
  ): void {
    const usage: ApiUsage = {
      apiKeyId: apiKey.id,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      responseTime,
      statusCode,
      requestSize,
      responseSize,
      userAgent,
      ip
    };

    if (!this.usage.has(apiKey.id)) {
      this.usage.set(apiKey.id, []);
    }

    const keyUsage = this.usage.get(apiKey.id)!;
    keyUsage.push(usage);

    // Garder seulement les 1000 dernières entrées par clé
    if (keyUsage.length > 1000) {
      keyUsage.splice(0, keyUsage.length - 1000);
    }

    // Mettre à jour la dernière utilisation
    apiKey.lastUsed = usage.timestamp;
  }

  public getApiKeyUsage(apiKeyId: string, limit: number = 100): ApiUsage[] {
    const usage = this.usage.get(apiKeyId) || [];
    return usage.slice(-limit);
  }

  public getApiKeyStats(apiKeyId: string): {
    totalRequests: number;
    requestsToday: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: { endpoint: string; count: number }[];
  } {
    const usage = this.usage.get(apiKeyId) || [];
    
    const today = new Date().toISOString().split('T')[0];
    const requestsToday = usage.filter(u => u.timestamp.startsWith(today)).length;
    
    const totalRequests = usage.length;
    const avgResponseTime = usage.length > 0 
      ? usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length 
      : 0;
      
    const errorRequests = usage.filter(u => u.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    const endpointCounts: { [endpoint: string]: number } = {};
    usage.forEach(u => {
      endpointCounts[u.endpoint] = (endpointCounts[u.endpoint] || 0) + 1;
    });
    
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalRequests,
      requestsToday,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints
    };
  }

  public createApiKey(
    userId: string,
    name: string,
    permissions: ApiPermission[]
  ): ApiKey {
    const rateLimit = { requestsPerMinute: 30, requestsPerHour: 1000, requestsPerDay: 5000 };

    const apiKey = this.generateApiKey(userId, name, permissions, rateLimit);
    this.apiKeys.set(apiKey.key, apiKey);
    
    return apiKey;
  }

  public deactivateApiKey(key: string): boolean {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey.isActive = false;
      return true;
    }
    return false;
  }

  public getAllApiKeys(): ApiKey[] {
    return Array.from(this.apiKeys.values());
  }

  public getUserApiKeys(userId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }
}
