export interface RegionalSentiment {
  region: string;
  regionCode: string;
  coordinates: [number, number]; // [longitude, latitude]
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalArticles: number;
  dominantSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 à +1
  topKeywords: string[];
  recentArticles: {
    id: string;
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: string;
  }[];
}

export interface SentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  totalArticles: number;
}

export interface KeywordSentiment {
  keyword: string;
  positive: number;
  negative: number;
  neutral: number;
  trend: 'rising' | 'falling' | 'stable';
  regions: string[];
}

export interface SentimentAnalysisResult {
  overall: {
    positive: number;
    negative: number;
    neutral: number;
    dominantSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
  };
  regional: RegionalSentiment[];
  trends: SentimentTrend[];
  keywords: KeywordSentiment[];
  lastUpdated: string;
}

// Régions françaises avec coordonnées
export const FRENCH_REGIONS = [
  { name: 'Île-de-France', code: 'IDF', coordinates: [2.3522, 48.8566] as [number, number] },
  { name: 'Provence-Alpes-Côte d\'Azur', code: 'PACA', coordinates: [5.3698, 43.2965] as [number, number] },
  { name: 'Auvergne-Rhône-Alpes', code: 'ARA', coordinates: [4.8357, 45.7640] as [number, number] },
  { name: 'Nouvelle-Aquitaine', code: 'NA', coordinates: [-0.5792, 44.8378] as [number, number] },
  { name: 'Occitanie', code: 'OCC', coordinates: [1.4442, 43.6047] as [number, number] },
  { name: 'Hauts-de-France', code: 'HDF', coordinates: [3.0573, 50.6292] as [number, number] },
  { name: 'Grand Est', code: 'GE', coordinates: [6.1757, 48.5734] as [number, number] },
  { name: 'Normandie', code: 'NOR', coordinates: [-0.3707, 49.1829] as [number, number] },
  { name: 'Bretagne', code: 'BRE', coordinates: [-2.7574, 48.2020] as [number, number] },
  { name: 'Pays de la Loire', code: 'PDL', coordinates: [-1.5534, 47.2184] as [number, number] },
  { name: 'Centre-Val de Loire', code: 'CVL', coordinates: [1.9040, 47.7516] as [number, number] },
  { name: 'Bourgogne-Franche-Comté', code: 'BFC', coordinates: [5.0415, 47.2805] as [number, number] },
  { name: 'Corse', code: 'COR', coordinates: [9.1500, 42.0396] as [number, number] },
];
