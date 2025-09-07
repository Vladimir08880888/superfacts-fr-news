/**
 * Module d'intelligence émotionnelle avancée
 * Détecte les émotions complexes, nuances, et tendances temporelles
 */

import { Article } from './news-collector';

export interface EmotionalProfile {
  primaryEmotion: string;
  secondaryEmotions: string[];
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  nuances: string[];
  confidence: number;
  emotionalComplexity: number;
  mixedEmotions?: {
    dominant: string;
    conflicting: string[];
    coherence: number;
  };
}

export interface TemporalTrend {
  timeframe: string;
  direction: 'rising' | 'falling' | 'stable' | 'volatile';
  velocity: number; // Vitesse du changement (-1 à 1)
  acceleration: number; // Accélération du changement
  inflectionPoints: Date[];
  predictedSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface EmotionalContext {
  culturalFactors: string[];
  socialContext: string;
  historicalRelevance: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  emotionalImpact: number;
}

export class EmotionalIntelligenceAnalyzer {
  private complexEmotionPatterns = {
    // Ironie et sarcasme
    irony: {
      patterns: [
        /quelle surprise/gi,
        /bien sûr/gi,
        /évidemment/gi,
        /comme c'est étonnant/gi,
        /vraiment génial/gi,
        /magnifique/gi,
        /formidable/gi
      ],
      contextualClues: ['hélas', 'malheureusement', 'encore une fois', 'comme toujours'],
      contradictionMarkers: ['mais', 'cependant', 'toutefois', 'néanmoins']
    },

    // Ambivalence
    ambivalence: {
      indicators: [
        'à la fois',
        'd\'un côté... de l\'autre',
        'certes... mais',
        'bien que',
        'malgré',
        'paradoxalement',
        'contradiction',
        'dilemme'
      ],
      emotionalConflicts: [
        { positive: ['espoir', 'optimisme'], negative: ['inquiétude', 'crainte'] },
        { positive: ['satisfaction', 'fierté'], negative: ['déception', 'regret'] },
        { positive: ['joie', 'bonheur'], negative: ['tristesse', 'mélancolie'] }
      ]
    },

    // Frustration et exaspération
    frustration: {
      escalationWords: [
        'encore', 'toujours', 'sans cesse', 'perpétuellement', 'constamment',
        'décidément', 'vraiment', 'assez', 'suffit', 'stop'
      ],
      emotionalMarkers: [
        'frustration', 'exaspération', 'ras-le-bol', 'agacement',
        'irritation', 'énervement', 'colère', 'indignation'
      ]
    },

    // Espoir et anticipation
    hope: {
      futureOrientedWords: [
        'espoir', 'espérer', 'espérons', 'souhait', 'souhaiter',
        'attendre', 'anticiper', 'prévoir', 'envisager', 'projeter'
      ],
      conditionalMarkers: [
        'si', 'pourvu que', 'à condition que', 'dans l\'espoir',
        'avec l\'espoir', 'en espérant', 'peut-être', 'probablement'
      ]
    },

    // Crainte et appréhension
    fear: {
      anxietyWords: [
        'crainte', 'peur', 'appréhension', 'anxiété', 'angoisse',
        'inquiétude', 'préoccupation', 'souci', 'alarme'
      ],
      threatMarkers: [
        'risque', 'danger', 'menace', 'péril', 'redouter',
        'avoir peur', 's\'inquiéter', 'craindre', 'appréhender'
      ]
    },

    // Mélancolie et nostalgie
    melancholy: {
      temporalMarkers: [
        'autrefois', 'jadis', 'avant', 'anciennement', 'naguère',
        'dans le temps', 'à l\'époque', 'il fut un temps'
      ],
      emotionalMarkers: [
        'mélancolie', 'nostalgie', 'regret', 'tristesse', 'amertume',
        'spleen', 'cafard', 'morosité', 'désolation'
      ]
    }
  };

  private culturalContexts = {
    french: {
      politicalSensitivities: [
        'république', 'laïcité', 'égalité', 'fraternité', 'liberté',
        'révolution', 'résistance', 'collaboration', 'mai 68'
      ],
      socialValues: [
        'solidarité', 'service public', 'exception française',
        'art de vivre', 'patrimoine', 'gastronomie'
      ],
      historicalEvents: [
        'guerre mondiale', 'résistance', 'libération', 'algérie',
        'mai 68', 'bicentenaire', 'millennium'
      ]
    }
  };

  /**
   * Analyse émotionnelle complexe d'un texte
   */
  public analyzeEmotionalComplexity(text: string, context?: any): EmotionalProfile {
    const primaryAnalysis = this.detectPrimaryEmotion(text);
    const nuances = this.detectEmotionalNuances(text);
    const mixedEmotions = this.analyzeMixedEmotions(text);
    const complexity = this.calculateEmotionalComplexity(text, nuances, mixedEmotions);

    return {
      primaryEmotion: primaryAnalysis.emotion,
      secondaryEmotions: primaryAnalysis.secondary,
      intensity: this.calculateIntensity(text, primaryAnalysis.strength),
      nuances,
      confidence: primaryAnalysis.confidence,
      emotionalComplexity: complexity,
      mixedEmotions
    };
  }

  /**
   * Analyse des tendances temporelles des sentiments
   */
  public analyzeTrends(articles: Article[], timeframe: '24h' | '7d' | '30d'): TemporalTrend[] {
    const trends: TemporalTrend[] = [];
    const timeGroups = this.groupByTime(articles, timeframe);
    
    Object.entries(timeGroups).forEach(([period, periodArticles]) => {
      if (periodArticles.length > 0) {
        const trend = this.calculateTrend(periodArticles, period);
        trends.push(trend);
      }
    });

    return trends.sort((a, b) => new Date(a.timeframe).getTime() - new Date(b.timeframe).getTime());
  }

  /**
   * Détecte l'émotion principale dans un texte
   */
  private detectPrimaryEmotion(text: string): {
    emotion: string;
    secondary: string[];
    strength: number;
    confidence: number;
  } {
    const emotionScores: { [emotion: string]: number } = {};
    const lowerText = text.toLowerCase();

    // Analyser chaque type d'émotion complexe
    Object.entries(this.complexEmotionPatterns).forEach(([emotionType, patterns]) => {
      let score = 0;

      if ('patterns' in patterns) {
        // Ironie
        (patterns as any).patterns.forEach((pattern: RegExp) => {
          const matches = lowerText.match(pattern);
          if (matches) score += matches.length * 2;
        });

        (patterns as any).contextualClues.forEach((clue: string) => {
          if (lowerText.includes(clue)) score += 1;
        });
      } else if ('indicators' in patterns) {
        // Ambivalence
        (patterns as any).indicators.forEach((indicator: string) => {
          if (lowerText.includes(indicator)) score += 1.5;
        });
      } else if ('escalationWords' in patterns || 'futureOrientedWords' in patterns || 'anxietyWords' in patterns || 'temporalMarkers' in patterns) {
        // Autres émotions
        const wordLists = Object.values(patterns as any);
        wordLists.forEach((wordList: unknown) => {
          const typedWordList = wordList as string[];
          if (Array.isArray(typedWordList)) {
            typedWordList.forEach((word: string) => {
              if (lowerText.includes(word.toLowerCase())) score += 1;
            });
          }
        });
      }

      if (score > 0) {
        emotionScores[emotionType] = score;
      }
    });

    // Déterminer l'émotion principale
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);

    const primaryEmotion = sortedEmotions[0] || ['neutral', 0];
    const secondaryEmotions = sortedEmotions.slice(1, 4).map(([emotion]) => emotion);

    const totalWords = text.split(/\s+/).length;
    const confidence = Math.min((primaryEmotion[1] / totalWords) * 10, 1);

    return {
      emotion: primaryEmotion[0],
      secondary: secondaryEmotions,
      strength: primaryEmotion[1],
      confidence
    };
  }

  /**
   * Détecte les nuances émotionnelles
   */
  private detectEmotionalNuances(text: string): string[] {
    const nuances: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    // Détection d'ironie
    if (this.detectIrony(text)) {
      nuances.add('irony');
    }

    // Détection d'ambivalence
    if (this.detectAmbivalence(text)) {
      nuances.add('ambivalence');
    }

    // Détection d'urgence
    const urgencyMarkers = ['urgent', 'immédiat', 'rapidement', 'tout de suite', 'sans délai', 'emergency'];
    if (urgencyMarkers.some(marker => lowerText.includes(marker))) {
      nuances.add('urgency');
    }

    // Détection d'incertitude
    const uncertaintyMarkers = ['peut-être', 'probablement', 'sans doute', 'il semblerait', 'on dit que'];
    if (uncertaintyMarkers.some(marker => lowerText.includes(marker))) {
      nuances.add('uncertainty');
    }

    // Détection de sarcasme
    if (this.detectSarcasm(text)) {
      nuances.add('sarcasm');
    }

    // Détection d'empathie
    const empathyMarkers = ['comprendre', 'compatir', 'solidarité', 'soutien', 'accompagner'];
    if (empathyMarkers.some(marker => lowerText.includes(marker))) {
      nuances.add('empathy');
    }

    return Array.from(nuances);
  }

  /**
   * Analyse les émotions mixtes et conflictuelles
   */
  private analyzeMixedEmotions(text: string): {
    dominant: string;
    conflicting: string[];
    coherence: number;
  } | undefined {
    const sentences = text.split(/[.!?]+/);
    const emotionsBySentence = sentences.map(sentence => 
      this.detectPrimaryEmotion(sentence)
    );

    // Identifier les émotions différentes
    const emotionTypes = new Set(emotionsBySentence.map(e => e.emotion));
    
    if (emotionTypes.size <= 1) {
      return undefined; // Pas d'émotions mixtes
    }

    // Calculer l'émotion dominante
    const emotionCounts: { [emotion: string]: number } = {};
    emotionsBySentence.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + e.strength;
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a);

    const dominant = sortedEmotions[0][0];
    const conflicting = sortedEmotions.slice(1).map(([emotion]) => emotion);

    // Calculer la cohérence (inverse de la diversité émotionnelle)
    const totalStrength = Object.values(emotionCounts).reduce((sum, val) => sum + val, 0);
    const dominantRatio = sortedEmotions[0][1] / totalStrength;
    const coherence = dominantRatio; // Plus l'émotion dominante est forte, plus c'est cohérent

    return {
      dominant,
      conflicting,
      coherence
    };
  }

  /**
   * Calcule la complexité émotionnelle du texte
   */
  private calculateEmotionalComplexity(
    text: string, 
    nuances: string[], 
    mixedEmotions?: { coherence: number }
  ): number {
    let complexity = 0;

    // Complexité basée sur les nuances détectées
    complexity += nuances.length * 0.2;

    // Complexité basée sur les émotions mixtes
    if (mixedEmotions) {
      complexity += (1 - mixedEmotions.coherence) * 0.3;
    }

    // Complexité basée sur la longueur et structure du texte
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgSentenceLength = words / sentences;
    
    if (avgSentenceLength > 20) complexity += 0.1; // Phrases complexes
    if (sentences > 10) complexity += 0.1; // Texte long

    // Complexité basée sur les marqueurs linguistiques
    const complexMarkers = [
      'cependant', 'néanmoins', 'toutefois', 'paradoxalement',
      'ironiquement', 'curieusement', 'étonnamment'
    ];
    
    const markerCount = complexMarkers.filter(marker => 
      text.toLowerCase().includes(marker)
    ).length;
    
    complexity += markerCount * 0.15;

    return Math.min(complexity, 1); // Plafonner à 1
  }

  /**
   * Calcule l'intensité émotionnelle
   */
  private calculateIntensity(text: string, strength: number): 'low' | 'medium' | 'high' | 'extreme' {
    const words = text.split(/\s+/).length;
    const intensityRatio = strength / Math.max(words, 1);

    // Ajuster en fonction des intensificateurs
    const intensifiers = [
      'extrêmement', 'terriblement', 'énormément', 'incroyablement',
      'absolument', 'complètement', 'totalement', 'vraiment'
    ];
    
    const intensifierCount = intensifiers.filter(intensifier =>
      text.toLowerCase().includes(intensifier)
    ).length;

    const adjustedRatio = intensityRatio + (intensifierCount * 0.1);

    if (adjustedRatio > 0.5) return 'extreme';
    if (adjustedRatio > 0.3) return 'high';
    if (adjustedRatio > 0.1) return 'medium';
    return 'low';
  }

  /**
   * Détecte l'ironie dans le texte
   */
  private detectIrony(text: string): boolean {
    const ironicPhrases = this.complexEmotionPatterns.irony.patterns;
    const contextualClues = this.complexEmotionPatterns.irony.contextualClues;
    
    const hasIronicPhrase = ironicPhrases.some(pattern => pattern.test(text));
    const hasContextualClue = contextualClues.some(clue => 
      text.toLowerCase().includes(clue)
    );

    // Ironie probable si phrase ironique + indices contextuels
    return hasIronicPhrase && hasContextualClue;
  }

  /**
   * Détecte l'ambivalence dans le texte
   */
  private detectAmbivalence(text: string): boolean {
    const ambivalenceIndicators = this.complexEmotionPatterns.ambivalence.indicators;
    
    return ambivalenceIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  /**
   * Détecte le sarcasme
   */
  private detectSarcasm(text: string): boolean {
    // Sarcasme = ironie + marqueurs négatifs + contexte contradictoire
    const hasIrony = this.detectIrony(text);
    const hasNegativeContext = [
      'encore', 'toujours', 'décidément', 'vraiment'
    ].some(marker => text.toLowerCase().includes(marker));

    const hasContradiction = [
      'mais', 'cependant', 'pourtant', 'hélas'
    ].some(marker => text.toLowerCase().includes(marker));

    return hasIrony && (hasNegativeContext || hasContradiction);
  }

  /**
   * Groupe les articles par période temporelle
   */
  private groupByTime(articles: Article[], timeframe: '24h' | '7d' | '30d'): { [period: string]: Article[] } {
    const groups: { [period: string]: Article[] } = {};
    const now = new Date();

    articles.forEach(article => {
      const articleDate = new Date(article.publishDate);
      let periodKey: string;

      switch (timeframe) {
        case '24h':
          periodKey = articleDate.toISOString().split('T')[0] + 'T' + 
                      String(articleDate.getHours()).padStart(2, '0') + ':00';
          break;
        case '7d':
          periodKey = articleDate.toISOString().split('T')[0];
          break;
        case '30d':
          const weekNumber = Math.floor(articleDate.getDate() / 7);
          periodKey = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}-W${weekNumber}`;
          break;
      }

      if (!groups[periodKey]) {
        groups[periodKey] = [];
      }
      groups[periodKey].push(article);
    });

    return groups;
  }

  /**
   * Calcule la tendance pour une période donnée
   */
  private calculateTrend(articles: Article[], period: string): TemporalTrend {
    // Analyse simple pour la démonstration
    const sentimentScores = articles.map(article => {
      const emotionalProfile = this.analyzeEmotionalComplexity(
        `${article.title} ${article.content}`
      );
      
      // Convertir l'émotion en score numérique
      const emotionToScore: { [key: string]: number } = {
        'hope': 0.8,
        'joy': 0.9,
        'satisfaction': 0.6,
        'fear': -0.7,
        'frustration': -0.8,
        'melancholy': -0.5,
        'irony': 0.1,
        'ambivalence': 0.0,
        'neutral': 0.0
      };

      return emotionToScore[emotionalProfile.primaryEmotion] || 0;
    });

    const avgScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    const direction = avgScore > 0.2 ? 'rising' : avgScore < -0.2 ? 'falling' : 'stable';
    
    // Calculer la vélocité (changement par rapport à la période précédente)
    const velocity = Math.tanh(avgScore); // Normalise entre -1 et 1
    
    return {
      timeframe: period,
      direction,
      velocity,
      acceleration: 0, // Simplification pour la démo
      inflectionPoints: [], // Simplification pour la démo
      predictedSentiment: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
      confidence: Math.min(articles.length / 10, 1) // Plus d'articles = plus de confiance
    };
  }
}
