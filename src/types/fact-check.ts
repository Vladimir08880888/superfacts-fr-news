export interface FactCheckResult {
  articleId: string;
  credibilityScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sourcesVerification: {
    isReliableSource: boolean;
    sourceCredibilityScore: number;
    sourceBias: 'left' | 'center' | 'right' | 'unknown';
    sourceHistory: {
      factualReporting: number; // 0-100
      controversyCount: number;
      corrections: number;
    };
  };
  crossReferenceCount: number;
  crossReferences: CrossReference[];
  warningFlags: WarningFlag[];
  textAnalysis: {
    emotionalLanguageScore: number; // 0-100
    clickbaitIndicators: number;
    sensationalismScore: number;
    factualClaimsCount: number;
    verifiableFactsCount: number;
  };
  timestamp: string;
  lastVerified: string;
}

export interface CrossReference {
  sourceUrl: string;
  sourceName: string;
  similarity: number; // 0-100
  agreement: 'confirms' | 'contradicts' | 'partial' | 'unrelated';
  credibility: number; // 0-100
}

export interface WarningFlag {
  type: 'source' | 'content' | 'timing' | 'structure' | 'claims';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: string;
  score: number; // Impact sur le score de crédibilité
}

export interface SourceCredibility {
  domain: string;
  name: string;
  credibilityScore: number; // 0-100
  bias: 'left' | 'center' | 'right' | 'unknown';
  factualReporting: number; // 0-100
  transparency: number; // 0-100
  reputation: number; // 0-100
  category: 'mainstream' | 'alternative' | 'blog' | 'social' | 'government' | 'academic';
  blacklisted: boolean;
  whitelisted: boolean;
  lastUpdated: string;
}

export interface FactCheckingStats {
  totalArticlesChecked: number;
  averageCredibilityScore: number;
  highRiskArticles: number;
  flaggedSources: number;
  mostCommonFlags: { type: string; count: number }[];
  credibilityDistribution: {
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 20-49
    critical: number; // 0-19
  };
}

// Base de données des sources françaises fiables
export const TRUSTED_FRENCH_SOURCES: SourceCredibility[] = [
  {
    domain: 'lemonde.fr',
    name: 'Le Monde',
    credibilityScore: 92,
    bias: 'center',
    factualReporting: 95,
    transparency: 90,
    reputation: 95,
    category: 'mainstream',
    blacklisted: false,
    whitelisted: true,
    lastUpdated: new Date().toISOString()
  },
  {
    domain: 'lefigaro.fr',
    name: 'Le Figaro',
    credibilityScore: 88,
    bias: 'center',
    factualReporting: 90,
    transparency: 85,
    reputation: 90,
    category: 'mainstream',
    blacklisted: false,
    whitelisted: true,
    lastUpdated: new Date().toISOString()
  },
  {
    domain: 'liberation.fr',
    name: 'Libération',
    credibilityScore: 87,
    bias: 'left',
    factualReporting: 88,
    transparency: 85,
    reputation: 88,
    category: 'mainstream',
    blacklisted: false,
    whitelisted: true,
    lastUpdated: new Date().toISOString()
  },
  {
    domain: 'francetvinfo.fr',
    name: 'France Info',
    credibilityScore: 93,
    bias: 'center',
    factualReporting: 96,
    transparency: 92,
    reputation: 94,
    category: 'mainstream',
    blacklisted: false,
    whitelisted: true,
    lastUpdated: new Date().toISOString()
  },
  {
    domain: 'france24.com',
    name: 'France 24',
    credibilityScore: 90,
    bias: 'center',
    factualReporting: 92,
    transparency: 88,
    reputation: 90,
    category: 'mainstream',
    blacklisted: false,
    whitelisted: true,
    lastUpdated: new Date().toISOString()
  }
];

// Indicateurs de contenu suspect
export const FAKE_NEWS_INDICATORS = {
  clickbaitPatterns: [
    /vous n'allez pas croire/i,
    /ce qui s'est passé ensuite/i,
    /choque internet/i,
    /la vérité va vous surprendre/i,
    /découvrez le secret/i,
    /ils ne veulent pas que vous sachiez/i,
    /révélation explosive/i,
    /complot dévoilé/i
  ],
  emotionalWords: [
    'choquant', 'scandaleux', 'incroyable', 'terrifiant', 'révoltant',
    'exclusif', 'secret', 'caché', 'interdit', 'censuré',
    'explosion', 'chaos', 'catastrophe', 'désastre', 'apocalypse'
  ],
  unreliableLanguage: [
    'on dit que', 'il paraît que', 'selon des sources anonymes',
    'des experts affirment', 'tout le monde sait que',
    'il est évident que', 'c\'est bien connu que'
  ]
};
