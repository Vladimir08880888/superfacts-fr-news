export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: ApiPermission[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

export interface ApiPermission {
  resource: 'articles' | 'sentiment' | 'fact-check' | 'recommendations' | 'analytics';
  actions: ('read' | 'write' | 'admin')[];
  constraints?: {
    maxResults?: number;
    categories?: string[];
    sources?: string[];
  };
}

export interface ApiUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ip?: string;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: string;
  windowType: 'minute' | 'hour' | 'day';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
    processingTime: number;
    rateLimit?: RateLimitStatus;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SuperFactsApiConfig {
  version: string;
  baseUrl: string;
  documentation: string;
  support: {
    email: string;
    website: string;
  };
  rateLimit: {
    free: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    };
    premium: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    };
    enterprise: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
  endpoints: ApiEndpoint[];
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  permissions: string[];
  parameters: ApiParameter[];
  responseExample: any;
  rateLimit?: {
    requestsPerMinute: number;
  };
}

export interface ApiParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: any;
  enum?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const API_CONFIG: SuperFactsApiConfig = {
  version: '1.0.0',
  baseUrl: 'https://superfacts.fr/api/v1',
  documentation: 'https://docs.superfacts.fr',
  support: {
    email: 'support@superfacts.fr',
    website: 'https://superfacts.fr/support'
  },
  rateLimit: {
    free: {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 5000
    },
    premium: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 50000
    },
    enterprise: {
      requestsPerMinute: 500,
      requestsPerHour: 25000,
      requestsPerDay: 1000000
    }
  },
  endpoints: [
    {
      path: '/articles',
      method: 'GET',
      description: 'Récupérer les articles de presse français',
      permissions: ['articles:read'],
      parameters: [
        {
          name: 'category',
          type: 'string',
          required: false,
          description: 'Filtrer par catégorie',
          enum: ['Actualités', 'Politique', 'Économie', 'Sport', 'Culture', 'Tech', 'Sciences']
        },
        {
          name: 'source',
          type: 'string',
          required: false,
          description: 'Filtrer par source'
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Nombre maximum d\'articles à retourner',
          validation: { min: 1, max: 100 }
        },
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Numéro de page pour la pagination'
        }
      ],
      responseExample: {
        success: true,
        data: {
          articles: [],
          total: 150
        },
        pagination: {
          page: 1,
          limit: 20,
          total: 150,
          hasMore: true
        }
      }
    },
    {
      path: '/sentiment',
      method: 'GET',
      description: 'Analyse de sentiment géographique des actualités',
      permissions: ['sentiment:read'],
      parameters: [
        {
          name: 'region',
          type: 'string',
          required: false,
          description: 'Filtrer par région française'
        }
      ],
      responseExample: {
        success: true,
        data: {
          overall: {
            positive: 25,
            negative: 15,
            neutral: 60,
            dominantSentiment: 'neutral'
          },
          regional: [],
          trends: []
        }
      }
    },
    {
      path: '/fact-check',
      method: 'POST',
      description: 'Vérification de la crédibilité d\'un article',
      permissions: ['fact-check:read'],
      parameters: [
        {
          name: 'articleId',
          type: 'string',
          required: true,
          description: 'ID de l\'article à vérifier'
        }
      ],
      responseExample: {
        success: true,
        data: {
          credibilityScore: 85,
          riskLevel: 'low',
          warningFlags: []
        }
      }
    },
    {
      path: '/recommendations',
      method: 'GET',
      description: 'Recommandations personnalisées d\'articles',
      permissions: ['recommendations:read'],
      parameters: [
        {
          name: 'userId',
          type: 'string',
          required: true,
          description: 'ID de l\'utilisateur'
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Nombre de recommandations'
        }
      ],
      responseExample: {
        success: true,
        data: {
          recommendations: [],
          metadata: {
            algorithm: 'Balanced',
            processingTime: 45
          }
        }
      }
    }
  ]
};

export const DEFAULT_API_PERMISSIONS: ApiPermission[] = [
  {
    resource: 'articles',
    actions: ['read'],
    constraints: {
      maxResults: 100,
      categories: ['Actualités', 'Politique', 'Économie', 'Sport', 'Culture']
    }
  }
];
