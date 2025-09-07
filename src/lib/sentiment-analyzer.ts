import { Article } from './news-collector';
import { 
  RegionalSentiment, 
  SentimentAnalysisResult, 
  SentimentTrend, 
  KeywordSentiment,
  FRENCH_REGIONS 
} from '@/types/sentiment';
import { sentimentCache, CachedSentiment } from './sentiment-cache';

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
    positive: {
      strong: [
        'succès', 'victoire', 'triomphe', 'excellence', 'exploit', 'prouesse',
        'révolution', 'percée', 'miracle', 'renaissance', 'record',
        'extraordinaire', 'exceptionnel', 'remarquable', 'formidable'
      ],
      moderate: [
        'réussite', 'croissance', 'amélioration', 'innovation', 'performance',
        'progrès', 'développement', 'expansion', 'essor', 'boom',
        'bénéfice', 'profit', 'gain', 'hausse', 'augmentation', 'progression',
        'optimisme', 'espoir', 'confiance', 'satisfaction', 'joie',
        'célébration', 'honneur', 'fierté', 'accomplissement'
      ],
      weak: [
        'bien', 'bon', 'mieux', 'positif', 'favorable', 'encourageant',
        'constructif', 'bénéfique', 'utile', 'avantageux', 'prometteur'
      ]
    },
    negative: {
      strong: [
        'catastrophe', 'tragédie', 'désastre', 'massacre', 'génocide',
        'terrorisme', 'guerre', 'violence', 'mort', 'décès', 'meurtre',
        'scandale', 'corruption', 'fraude', 'escroquerie', 'trahison'
      ],
      moderate: [
        'crise', 'échec', 'problème', 'difficulté', 'accident', 'conflit',
        'tension', 'chute', 'baisse', 'diminution', 'récession', 'faillite',
        'licenciement', 'menace', 'danger', 'risque', 'inquiétude',
        'préoccupation', 'colère', 'frustration', 'déception'
      ],
      weak: [
        'mal', 'mauvais', 'pire', 'négatif', 'défavorable', 'décourageant',
        'problématique', 'nuisible', 'désavantageux', 'préoccupant'
      ]
    },
    intensifiers: [
      'très', 'extrêmement', 'particulièrement', 'vraiment', 'absolument',
      'complètement', 'totalement', 'énormément', 'considérablement'
    ],
    diminishers: [
      'peu', 'légèrement', 'faiblement', 'modérément', 'relativement',
      'assez', 'plutôt', 'quelque peu', 'un peu'
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
    emotions?: string[];
    intensity: 'low' | 'medium' | 'high';
  } {
    const titleText = article.title.toLowerCase();
    const contentText = article.content.toLowerCase();
    const fullText = `${titleText} ${contentText}`;
    
    let positiveScore = 0;
    let negativeScore = 0;
    let emotionWords: string[] = [];
    
    // Analyse des sentiments positifs avec pondération par intensité
    Object.entries(this.sentimentKeywords.positive).forEach(([intensity, keywords]) => {
      if (intensity === 'strong' || intensity === 'moderate' || intensity === 'weak') {
        const weight = intensity === 'strong' ? 3 : intensity === 'moderate' ? 2 : 1;
        (keywords as string[]).forEach(keyword => {
          const titleCount = (titleText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          const contentCount = (contentText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          
          if (titleCount + contentCount > 0) {
            emotionWords.push(keyword);
            const baseScore = (titleCount * 2 + contentCount) * weight;
            
            // Vérifier les intensificateurs/diminutifs autour du mot-clé
            const modifiedScore = this.checkModifiers(fullText, keyword, baseScore);
            positiveScore += modifiedScore;
          }
        });
      }
    });
    
    // Analyse des sentiments négatifs avec pondération par intensité
    Object.entries(this.sentimentKeywords.negative).forEach(([intensity, keywords]) => {
      if (intensity === 'strong' || intensity === 'moderate' || intensity === 'weak') {
        const weight = intensity === 'strong' ? 3 : intensity === 'moderate' ? 2 : 1;
        (keywords as string[]).forEach(keyword => {
          const titleCount = (titleText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          const contentCount = (contentText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          
          if (titleCount + contentCount > 0) {
            emotionWords.push(keyword);
            const baseScore = (titleCount * 2 + contentCount) * weight;
            
            // Vérifier les intensificateurs/diminutifs autour du mot-clé
            const modifiedScore = this.checkModifiers(fullText, keyword, baseScore);
            negativeScore += modifiedScore;
          }
        });
      }
    });
    
    // Analyse contextuelle pour détecter les négations
    const { positiveAdjusted, negativeAdjusted } = this.adjustForNegations(fullText, positiveScore, negativeScore);
    
    // Calcul du score final normalisé
    const totalScore = positiveAdjusted + negativeAdjusted;
    const rawScore = totalScore === 0 ? 0 : (positiveAdjusted - negativeAdjusted) / Math.max(totalScore, 1);
    
    // Score final entre -1 et 1
    const score = Math.max(-1, Math.min(1, rawScore));
    
    // Confiance basée sur plusieurs facteurs
    const keywordCount = emotionWords.length;
    const textLength = fullText.split(' ').length;
    const confidence = Math.min(
      (keywordCount / 10) * 0.6 + 
      (Math.min(textLength, 100) / 100) * 0.4, 
      1
    );
    
    // Détermination du sentiment avec seuils adaptatifs
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const threshold = 0.15 - (confidence * 0.05); // Seuil adaptatif basé sur la confiance
    
    if (Math.abs(score) > threshold) {
      sentiment = score > 0 ? 'positive' : 'negative';
    }
    
    // Détermination de l'intensité
    let intensity: 'low' | 'medium' | 'high' = 'low';
    const absScore = Math.abs(score);
    if (absScore > 0.6) intensity = 'high';
    else if (absScore > 0.3) intensity = 'medium';
    
    return { 
      sentiment, 
      score, 
      confidence, 
      emotions: emotionWords.slice(0, 5), // Top 5 emotions detected
      intensity 
    };
  }
  
  private checkModifiers(text: string, keyword: string, baseScore: number): number {
    const keywordRegex = new RegExp(`(.{0,20})\\b${keyword}\\b(.{0,20})`, 'gi');
    const matches = text.match(keywordRegex);
    
    if (!matches) return baseScore;
    
    let modifiedScore = baseScore;
    
    matches.forEach(match => {
      const context = match.toLowerCase();
      
      // Vérifier les intensificateurs
      const hasIntensifier = this.sentimentKeywords.intensifiers.some(intensifier => 
        context.includes(intensifier)
      );
      
      // Vérifier les diminutifs
      const hasDiminisher = this.sentimentKeywords.diminishers.some(diminisher => 
        context.includes(diminisher)
      );
      
      if (hasIntensifier) {
        modifiedScore *= 1.5; // Augmente l'intensité
      } else if (hasDiminisher) {
        modifiedScore *= 0.7; // Diminue l'intensité
      }
    });
    
    return modifiedScore;
  }
  
  private adjustForNegations(text: string, positiveScore: number, negativeScore: number): {
    positiveAdjusted: number;
    negativeAdjusted: number;
  } {
    const negationWords = ['ne pas', 'n\'est pas', 'n\'a pas', 'jamais', 'aucun', 'sans', 'ni'];
    const sentences = text.split(/[.!?;]/);
    
    let positiveAdjusted = positiveScore;
    let negativeAdjusted = negativeScore;
    
    sentences.forEach(sentence => {
      const hasNegation = negationWords.some(neg => sentence.includes(neg));
      
      if (hasNegation) {
        // Si la phrase contient une négation, inverser partiellement le sentiment
        const sentencePositive = this.countPositiveWords(sentence);
        const sentenceNegative = this.countNegativeWords(sentence);
        
        if (sentencePositive > sentenceNegative) {
          // Phrase avec mots positifs mais négation -> réduire le positif, augmenter le négatif
          positiveAdjusted -= sentencePositive * 0.8;
          negativeAdjusted += sentencePositive * 0.4;
        } else if (sentenceNegative > sentencePositive) {
          // Phrase avec mots négatifs mais négation -> réduire le négatif, augmenter le positif
          negativeAdjusted -= sentenceNegative * 0.8;
          positiveAdjusted += sentenceNegative * 0.4;
        }
      }
    });
    
    return {
      positiveAdjusted: Math.max(0, positiveAdjusted),
      negativeAdjusted: Math.max(0, negativeAdjusted)
    };
  }
  
  private countPositiveWords(text: string): number {
    let count = 0;
    Object.values(this.sentimentKeywords.positive).forEach(keywords => {
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          count += (text.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
        });
      }
    });
    return count;
  }
  
  private countNegativeWords(text: string): number {
    let count = 0;
    Object.values(this.sentimentKeywords.negative).forEach(keywords => {
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          count += (text.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
        });
      }
    });
    return count;
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
    
    // Utiliser le cache pour optimiser les performances
    const articlesForAnalysis = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content + ' ' + article.summary
    }));
    
    const { cached, toAnalyze } = sentimentCache.analyzeBatch(articlesForAnalysis);
    
    // Traiter les résultats mis en cache
    const cachedResults = new Map<string, CachedSentiment>();
    cached.forEach(result => {
      cachedResults.set(result.articleId, result);
    });
    
    // Analyser les nouveaux articles
    const newResults = new Map<string, any>();
    toAnalyze.forEach(item => {
      const article = articles.find(a => a.id === item.id);
      if (article) {
        const sentimentResult = this.calculateAdvancedSentiment(article);
        newResults.set(article.id, sentimentResult);
        
        // Ajouter au cache
        sentimentCache.set(article.id, article.title, item.content, {
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: sentimentResult.confidence,
          intensity: sentimentResult.intensity,
          emotions: sentimentResult.emotions
        });
      }
    });

    // Analyser chaque article (en utilisant le cache quand possible)
    articles.forEach(article => {
      const region = this.detectRegion(article);
      
      // Récupérer le résultat depuis le cache ou les nouveaux résultats
      let sentimentResult;
      const cached = cachedResults.get(article.id);
      if (cached) {
        sentimentResult = {
          sentiment: cached.sentiment,
          score: cached.score,
          confidence: cached.confidence,
          intensity: cached.intensity || 'medium',
          emotions: cached.emotions
        };
      } else {
        sentimentResult = newResults.get(article.id) || this.calculateAdvancedSentiment(article);
      }
      
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
