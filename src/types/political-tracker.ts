export interface PoliticalFigure {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  position: string;
  isActive: boolean;
  imageUrl?: string;
  bio: string;
  socialMedia: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  keywords: string[];
  aliases: string[]; // Différentes façons dont la personne peut être mentionnée
}

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'election' | 'debate' | 'announcement' | 'vote' | 'meeting' | 'crisis' | 'other';
  importance: 'low' | 'medium' | 'high' | 'critical';
  participants: string[]; // IDs des personnalités politiques
  location?: string;
  tags: string[];
  relatedArticles: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface PromiseTracking {
  id: string;
  politicalFigureId: string;
  promise: string;
  category: string;
  datePromised: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'broken' | 'modified';
  progress: number; // 0-100
  evidence: Evidence[];
  relatedArticles: string[];
  lastUpdated: string;
  publicOpinion: {
    support: number; // 0-100
    opposition: number; // 0-100
    neutral: number; // 0-100
  };
}

export interface Evidence {
  type: 'article' | 'statement' | 'action' | 'vote' | 'document';
  source: string;
  url?: string;
  date: string;
  description: string;
  supportLevel: 'strong_support' | 'weak_support' | 'neutral' | 'weak_opposition' | 'strong_opposition';
}

export interface MediaPresence {
  politicalFigureId: string;
  period: string; // ISO date or period like "2025-01"
  mentionCount: number;
  sentimentScore: number; // -100 to +100
  topArticles: {
    articleId: string;
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    date: string;
    source: string;
  }[];
  keywords: { word: string; count: number }[];
  trend: 'rising' | 'stable' | 'falling';
}

export interface PoliticalInsight {
  type: 'trend' | 'controversy' | 'achievement' | 'promise_update' | 'election_forecast';
  title: string;
  description: string;
  confidence: number; // 0-100
  relevantFigures: string[];
  dataPoints: any[];
  generatedAt: string;
  importance: 'low' | 'medium' | 'high';
}

export interface ElectionData {
  id: string;
  name: string;
  type: 'presidential' | 'legislative' | 'municipal' | 'european' | 'regional';
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  candidates: {
    politicalFigureId: string;
    party: string;
    polls?: number; // percentage
    results?: number; // actual results percentage
  }[];
  keyIssues: string[];
  coverage: {
    articleCount: number;
    sentimentByCandidate: { [candidateId: string]: number };
  };
}

export interface PoliticalAnalytics {
  topFigures: {
    politicalFigureId: string;
    name: string;
    mentionCount: number;
    sentimentScore: number;
    trend: 'rising' | 'stable' | 'falling';
  }[];
  activePromises: number;
  completedPromises: number;
  brokenPromises: number;
  upcomingEvents: number;
  controversialTopics: {
    topic: string;
    articleCount: number;
    avgSentiment: number;
  }[];
  mediaAttention: {
    figure: string;
    coverage: number;
    change: number; // percentage change from previous period
  }[];
}

// Base de données des personnalités politiques françaises
export const FRENCH_POLITICAL_FIGURES: PoliticalFigure[] = [
  {
    id: 'macron-emmanuel',
    name: 'Emmanuel Macron',
    firstName: 'Emmanuel',
    lastName: 'Macron',
    party: 'Renaissance',
    position: 'Président de la République',
    isActive: true,
    bio: 'Président de la République française depuis 2017',
    socialMedia: {
      twitter: '@EmmanuelMacron',
      website: 'https://www.elysee.fr'
    },
    keywords: ['macron', 'président', 'renaissance', 'élysée'],
    aliases: ['macron', 'emmanuel macron', 'président macron', 'le président']
  },
  {
    id: 'melenchon-jean-luc',
    name: 'Jean-Luc Mélenchon',
    firstName: 'Jean-Luc',
    lastName: 'Mélenchon',
    party: 'La France Insoumise',
    position: 'Député',
    isActive: true,
    bio: 'Leader de La France Insoumise',
    socialMedia: {
      twitter: '@JLMelenchon'
    },
    keywords: ['mélenchon', 'lfi', 'france insoumise', 'insoumis'],
    aliases: ['mélenchon', 'jean-luc mélenchon', 'jlm', 'mélenchon']
  },
  {
    id: 'le-pen-marine',
    name: 'Marine Le Pen',
    firstName: 'Marine',
    lastName: 'Le Pen',
    party: 'Rassemblement National',
    position: 'Députée',
    isActive: true,
    bio: 'Présidente du Rassemblement National',
    socialMedia: {
      twitter: '@MLP_officiel'
    },
    keywords: ['le pen', 'marine', 'rn', 'rassemblement national'],
    aliases: ['le pen', 'marine le pen', 'mlp', 'marine']
  },
  {
    id: 'bardella-jordan',
    name: 'Jordan Bardella',
    firstName: 'Jordan',
    lastName: 'Bardella',
    party: 'Rassemblement National',
    position: 'Député européen',
    isActive: true,
    bio: 'Président du Rassemblement National',
    socialMedia: {
      twitter: '@jordanbardella'
    },
    keywords: ['bardella', 'jordan', 'rn'],
    aliases: ['bardella', 'jordan bardella']
  },
  {
    id: 'philippe-edouard',
    name: 'Édouard Philippe',
    firstName: 'Édouard',
    lastName: 'Philippe',
    party: 'Horizons',
    position: 'Maire du Havre',
    isActive: true,
    bio: 'Ancien Premier ministre, maire du Havre',
    socialMedia: {
      twitter: '@EPhilippePM'
    },
    keywords: ['philippe', 'édouard', 'horizons', 'le havre'],
    aliases: ['philippe', 'édouard philippe', 'edouard philippe']
  }
];
