import { Article } from './news-collector';
import { 
  RegionalSentiment, 
  SentimentAnalysisResult, 
  SentimentTrend, 
  KeywordSentiment,
  FRENCH_REGIONS 
} from '@/types/sentiment';

export class SentimentAnalyzer {
  private regionalKeywords: { [region: string]: string[] } = {
    'Île-de-France': ['paris', 'ile-de-france', 'idf', 'région parisienne', 'banlieue', 'métropole'],
    'Provence-Alpes-Côte d\'Azur': ['marseille', 'nice', 'cannes', 'provence', 'paca', 'côte d\'azur', 'alpes-maritimes'],
    'Auvergne-Rhône-Alpes': ['lyon', 'grenoble', 'saint-étienne', 'rhône-alpes', 'auvergne', 'isère', 'rhône'],
    'Nouvelle-Aquitaine': ['bordeaux', 'toulouse', 'nouvelle-aquitaine', 'gironde', 'landes', 'pyrénées'],
    'Occitanie': ['montpellier', 'toulouse', 'occitanie', 'languedoc', 'hérault', 'gard'],
    'Hauts-de-France': ['lille', 'amiens', 'hauts-de-france', 'nord', 'pas-de-calais', 'picardie'],
    'Grand Est': ['strasbourg', 'metz', 'reims', 'grand est', 'alsace', 'lorraine', 'champagne'],
    'Normandie': ['rouen', 'caen', 'le havre', 'normandie', 'calvados', 'manche', 'eure'],
    'Bretagne': ['rennes', 'brest', 'nantes', 'bretagne', 'finistère', 'morbihan', 'côtes-d\'armor'],
    'Pays de la Loire': ['nantes', 'angers', 'le mans', 'pays de la loire', 'loire-atlantique', 'maine-et-loire'],
    'Centre-Val de Loire': ['orléans', 'tours', 'bourges', 'centre-val de loire', 'indre-et-loire', 'loiret'],
    'Bourgogne-Franche-Comté': ['dijon', 'besançon', 'bourgogne', 'franche-comté', 'côte-d\'or', 'doubs'],
    'Corse': ['ajaccio', 'bastia', 'corse', 'corse-du-sud', 'haute-corse']
  };

  private sentimentKeywords = {
    positive: [
      'succès', 'victoire', 'réussite', 'croissance', 'amélioration', 'innovation', 
      'excellence', 'record', 'performance', 'progrès', 'développement', 'expansion',
      'renaissance', 'essor', 'boom', 'triomphe', 'exploit', 'prouesse',
      'bénéfice', 'profit', 'gain', 'hausse', 'augmentation', 'progression'
    ],
    negative: [
      'crise', 'échec', 'problème', 'difficulté', 'catastrophe', 'accident', 
      'mort', 'décès', 'violence', 'guerre', 'conflit', 'tension',
      'chute', 'baisse', 'diminution', 'récession', 'faillite', 'licenciement',
      'scandale', 'corruption', 'fraude', 'menace', 'danger', 'risque'
    ]
  };

  private detectRegion(article: Article): string | null {
    const text = `${article.title} ${article.content} ${article.summary}`.toLowerCase();
    
    for (const [region, keywords] of Object.entries(this.regionalKeywords)) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        return region;
      }
    }
    
    return null;
  }

  private calculateAdvancedSentiment(article: Article): {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  } {
    const text = `${article.title} ${article.content}`.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    // Analyse des mots-clés avec pondération
    this.sentimentKeywords.positive.forEach(keyword => {
      const count = (text.match(new RegExp(keyword, 'g')) || []).length;
      positiveScore += count * (article.title.toLowerCase().includes(keyword) ? 2 : 1);
    });
    
    this.sentimentKeywords.negative.forEach(keyword => {
      const count = (text.match(new RegExp(keyword, 'g')) || []).length;
      negativeScore += count * (article.title.toLowerCase().includes(keyword) ? 2 : 1);
    });
    
    // Calcul du score final
    const totalScore = positiveScore + negativeScore;
    const score = totalScore === 0 ? 0 : (positiveScore - negativeScore) / totalScore;
    const confidence = Math.min(totalScore / 5, 1); // Confiance basée sur le nombre de mots-clés trouvés
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (Math.abs(score) > 0.2) {
      sentiment = score > 0 ? 'positive' : 'negative';
    }
    
    return { sentiment, score, confidence };
  }

  private extractKeywords(articles: Article[]): string[] {
    const allText = articles.map(a => `${a.title} ${a.content}`).join(' ').toLowerCase();
    
    const commonWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'ce', 'cette', 'ces',
      'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi',
      'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous', 'vers', 'entre'
    ]);
    
    const words = allText.split(/\s+/).filter(word => 
      word.length > 3 && 
      !commonWords.has(word) && 
      /^[a-zA-Zàâäéèêëïîôöùûüÿç]+$/.test(word)
    );
    
    const wordCount: { [word: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  public analyzeArticles(articles: Article[]): SentimentAnalysisResult {
    const regionalData: { [region: string]: RegionalSentiment } = {};
    
    // Initialiser les données régionales
    FRENCH_REGIONS.forEach(region => {
      regionalData[region.name] = {
        region: region.name,
        regionCode: region.code,
        coordinates: region.coordinates,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalArticles: 0,
        dominantSentiment: 'neutral',
        sentimentScore: 0,
        topKeywords: [],
        recentArticles: []
      };
    });

    let overallPositive = 0;
    let overallNegative = 0;
    let overallNeutral = 0;

    // Analyser chaque article
    articles.forEach(article => {
      const region = this.detectRegion(article);
      const sentimentResult = this.calculateAdvancedSentiment(article);
      
      // Mettre à jour les statistiques globales
      if (sentimentResult.sentiment === 'positive') overallPositive++;
      else if (sentimentResult.sentiment === 'negative') overallNegative++;
      else overallNeutral++;
      
      // Mettre à jour les statistiques régionales
      if (region && regionalData[region]) {
        const regionData = regionalData[region];
        regionData.totalArticles++;
        
        if (sentimentResult.sentiment === 'positive') regionData.positiveCount++;
        else if (sentimentResult.sentiment === 'negative') regionData.negativeCount++;
        else regionData.neutralCount++;
        
        regionData.recentArticles.push({
          id: article.id,
          title: article.title,
          sentiment: sentimentResult.sentiment,
          timestamp: article.publishDate
        });
        
        // Garder seulement les 5 articles les plus récents
        regionData.recentArticles = regionData.recentArticles
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);
      }
    });

    // Calculer les métriques finales pour chaque région
    Object.values(regionalData).forEach(regionData => {
      if (regionData.totalArticles > 0) {
        const { positiveCount, negativeCount, neutralCount, totalArticles } = regionData;
        
        // Déterminer le sentiment dominant
        if (positiveCount >= negativeCount && positiveCount >= neutralCount) {
          regionData.dominantSentiment = 'positive';
        } else if (negativeCount >= neutralCount) {
          regionData.dominantSentiment = 'negative';
        }
        
        // Calculer le score de sentiment (-1 à +1)
        regionData.sentimentScore = (positiveCount - negativeCount) / totalArticles;
        
        // Extraire les mots-clés pour cette région
        const regionArticles = articles.filter(article => this.detectRegion(article) === regionData.region);
        regionData.topKeywords = this.extractKeywords(regionArticles);
      }
    });

    // Calculer les tendances (simulation pour la démonstration)
    const trends: SentimentTrend[] = this.generateTrends(articles);
    
    // Analyser les mots-clés globaux
    const keywords: KeywordSentiment[] = this.analyzeKeywordSentiments(articles);

    const total = overallPositive + overallNegative + overallNeutral;
    const overallScore = total === 0 ? 0 : (overallPositive - overallNegative) / total;

    return {
      overall: {
        positive: overallPositive,
        negative: overallNegative,
        neutral: overallNeutral,
        dominantSentiment: overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral',
        sentimentScore: overallScore
      },
      regional: Object.values(regionalData).filter(r => r.totalArticles > 0),
      trends,
      keywords,
      lastUpdated: new Date().toISOString()
    };
  }

  private generateTrends(articles: Article[]): SentimentTrend[] {
    const trends: SentimentTrend[] = [];
    const now = new Date();
    
    // Générer les tendances pour les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayArticles = articles.filter(article => {
        const articleDate = new Date(article.publishDate).toISOString().split('T')[0];
        return articleDate === dateStr;
      });
      
      let positive = 0, negative = 0, neutral = 0;
      dayArticles.forEach(article => {
        const sentiment = this.calculateAdvancedSentiment(article).sentiment;
        if (sentiment === 'positive') positive++;
        else if (sentiment === 'negative') negative++;
        else neutral++;
      });
      
      trends.push({
        date: dateStr,
        positive,
        negative,
        neutral,
        totalArticles: dayArticles.length
      });
    }
    
    return trends;
  }

  private analyzeKeywordSentiments(articles: Article[]): KeywordSentiment[] {
    const keywordStats: { [keyword: string]: KeywordSentiment } = {};
    
    const globalKeywords = this.extractKeywords(articles);
    
    globalKeywords.forEach(keyword => {
      const relatedArticles = articles.filter(article => 
        `${article.title} ${article.content}`.toLowerCase().includes(keyword)
      );
      
      let positive = 0, negative = 0, neutral = 0;
      const regions = new Set<string>();
      
      relatedArticles.forEach(article => {
        const sentiment = this.calculateAdvancedSentiment(article).sentiment;
        if (sentiment === 'positive') positive++;
        else if (sentiment === 'negative') negative++;
        else neutral++;
        
        const region = this.detectRegion(article);
        if (region) regions.add(region);
      });
      
      keywordStats[keyword] = {
        keyword,
        positive,
        negative,
        neutral,
        trend: 'stable', // Simplifié pour la démo
        regions: Array.from(regions)
      };
    });
    
    return Object.values(keywordStats).slice(0, 15);
  }
}
