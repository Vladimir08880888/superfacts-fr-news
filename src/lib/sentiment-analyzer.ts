import { Article } from './news-collector';
import { 
  RegionalSentiment, 
  SentimentAnalysisResult, 
  SentimentTrend, 
  KeywordSentiment,
  FRENCH_REGIONS 
} from '@/types/sentiment';
import { sentimentCache, CachedSentiment } from './sentiment-cache';
import { SemanticAnalyzer, SemanticEntity, SemanticRelation, TopicSentiment } from './semantic-analyzer';

export class SentimentAnalyzer {
  private semanticAnalyzer: SemanticAnalyzer;
  
  constructor() {
    this.semanticAnalyzer = new SemanticAnalyzer();
  }
  
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
        // Réussite et accomplissement
        'succès', 'victoire', 'triomphe', 'excellence', 'exploit', 'prouesse',
        'révolution', 'percée', 'miracle', 'renaissance', 'record', 'champion',
        'extraordinaire', 'exceptionnel', 'remarquable', 'formidable', 'spectaculaire',
        'magnifique', 'époustouflant', 'éblouissant', 'grandiose', 'prestigieux',
        
        // Économie et business
        'prospérité', 'enrichissement', 'florissant', 'rentabilité', 'profitabilité',
        'croissance explosive', 'boom économique', 'expansion rapide', 'dynamisme',
        'compétitivité', 'leadership', 'domination', 'hégémonie',
        
        // Politique et société
        'démocratisation', 'libération', 'émancipation', 'révolution démocratique',
        'réforme majeure', 'modernisation', 'transparence', 'justice sociale',
        'égalité', 'solidarité', 'fraternité', 'unité nationale',
        
        // Innovation et technologie
        'révolution technologique', 'innovation de rupture', 'avancée majeure',
        'découverte révolutionnaire', 'invention géniale', 'progrès technologique',
        'transformation digitale', 'intelligence artificielle avancée',
        
        // Sport et culture
        'performance légendaire', 'exploit sportif', 'record mondial',
        'chef-d\'œuvre', 'création artistique majeure', 'œuvre magistrale',
        'talent exceptionnel', 'génie créatif'
      ],
      moderate: [
        // Amélioration générale
        'réussite', 'croissance', 'amélioration', 'innovation', 'performance',
        'progrès', 'développement', 'expansion', 'essor', 'boom', 'avancement',
        'perfectionnement', 'optimisation', 'modernisation', 'renouveau',
        
        // Économie
        'bénéfice', 'profit', 'gain', 'hausse', 'augmentation', 'progression',
        'reprise', 'redressement', 'relance', 'stimulation', 'investissement',
        'création d\'emplois', 'embauche', 'recrutement', 'stabilité financière',
        
        // Émotions positives
        'optimisme', 'espoir', 'confiance', 'satisfaction', 'joie', 'bonheur',
        'enthousiasme', 'motivation', 'inspiration', 'sérénité', 'apaisement',
        'célébration', 'honneur', 'fierté', 'accomplissement', 'reconnaissance',
        
        // Social et politique
        'coopération', 'collaboration', 'partenariat', 'alliance', 'consensus',
        'réconciliation', 'apaisement', 'dialogue', 'négociation réussie',
        'accord', 'traité', 'résolution', 'médiation', 'compromis constructif',
        
        // Santé et bien-être
        'guérison', 'rémission', 'amélioration de l\'état', 'rétablissement',
        'santé retrouvée', 'vitalité', 'forme olympique', 'bien-être',
        
        // Éducation et culture
        'apprentissage', 'formation', 'éducation', 'culture', 'savoir',
        'connaissance', 'expertise', 'compétence', 'maîtrise', 'excellence académique'
      ],
      weak: [
        'bien', 'bon', 'mieux', 'positif', 'favorable', 'encourageant',
        'constructif', 'bénéfique', 'utile', 'avantageux', 'prometteur',
        'intéressant', 'convenable', 'correct', 'acceptable', 'satisfaisant',
        'agréable', 'plaisant', 'sympathique', 'aimable', 'souriant',
        'poli', 'courtois', 'respectueux', 'attentionné', 'généreux',
        'raisonnable', 'logique', 'sensé', 'intelligent', 'malin',
        'efficace', 'productif', 'rentable', 'viable', 'durable',
        'stable', 'solide', 'fiable', 'sûr', 'sécurisé'
      ]
    },
    negative: {
      strong: [
        // Violence et tragédie
        'catastrophe', 'tragédie', 'désastre', 'massacre', 'génocide', 'holocauste',
        'terrorisme', 'attentat', 'guerre', 'conflit armé', 'violence', 'brutalité',
        'mort', 'décès', 'meurtre', 'assassinat', 'homicide', 'crime',
        'torture', 'supplice', 'souffrance', 'agonie', 'calvaire',
        
        // Corruption et scandale
        'scandale', 'corruption', 'fraude', 'escroquerie', 'trahison',
        'détournement', 'malversation', 'prévarication', 'concussion',
        'chantage', 'extorsion', 'racket', 'blanchiment', 'évasion fiscale',
        
        // Économie catastrophique
        'effondrement', 'krach', 'banqueroute', 'ruine', 'débâcle financière',
        'récession majeure', 'dépression économique', 'chômage de masse',
        'paupérisation', 'appauvrissement', 'précarisation',
        
        // Politique et société
        'dictature', 'tyrannie', 'oppression', 'persécution', 'répression',
        'censure', 'totalitarisme', 'autoritarisme', 'fascisme',
        'révolution sanglante', 'coup d\'état', 'putsch', 'insurrection',
        
        // Catastrophes naturelles
        'tsunami', 'ouragan dévastateur', 'tremblement de terre',
        'inondation catastrophique', 'sécheresse extrême', 'famine',
        'épidémie', 'pandémie', 'virus mortel', 'contagion'
      ],
      moderate: [
        // Problèmes généraux
        'crise', 'échec', 'problème', 'difficulté', 'obstacle', 'entrave',
        'complication', 'contrariété', 'désagrément', 'incident',
        'accident', 'conflit', 'dispute', 'querelle', 'différend',
        
        // Économie
        'tension', 'chute', 'baisse', 'diminution', 'déclin', 'ralentissement',
        'récession', 'stagnation', 'faillite', 'liquidation', 'fermeture',
        'licenciement', 'restructuration', 'plan social', 'compression',
        'déficit', 'dette', 'endettement', 'surendettement',
        
        // Émotions négatives
        'menace', 'danger', 'risque', 'péril', 'inquiétude', 'angoisse',
        'préoccupation', 'stress', 'pression', 'tension nerveuse',
        'colère', 'irritation', 'agacement', 'exaspération',
        'frustration', 'déception', 'amertume', 'ressentiment',
        'tristesse', 'mélancolie', 'nostalgie', 'regret',
        
        // Social et politique
        'protestation', 'manifestation', 'grève', 'blocage', 'paralysie',
        'désordre', 'chaos', 'anarchie', 'instabilité politique',
        'division', 'polarisation', 'fragmentation', 'exclusion',
        
        // Santé
        'maladie', 'pathologie', 'syndrome', 'infection', 'contamination',
        'dégradation', 'détérioration', 'affaiblissement', 'épuisement'
      ],
      weak: [
        'mal', 'mauvais', 'pire', 'négatif', 'défavorable', 'décourageant',
        'problématique', 'nuisible', 'désavantageux', 'préoccupant',
        'inquiétant', 'troublant', 'gênant', 'embêtant', 'ennuyeux',
        'désagréable', 'déplaisant', 'fâcheux', 'regrettable',
        'dommage', 'malheureux', 'triste', 'pénible', 'difficile',
        'compliqué', 'complexe', 'confus', 'flou', 'incertain',
        'douteux', 'suspect', 'louche', 'bizarre', 'étrange',
        'faible', 'fragile', 'précaire', 'instable', 'vulnérable'
      ]
    },
    // Expressions idiomatiques et contextuelles
    contextual: {
      positive_expressions: [
        'vent en poupe', 'sur la bonne voie', 'bon augure', 'bonne étoile',
        'main tendue', 'ciel bleu', 'horizon dégagé', 'avenir radieux',
        'page tournée', 'nouveau départ', 'renaissance', 'second souffle',
        'coup de maître', 'coup de génie', 'masterstroke', 'tour de force'
      ],
      negative_expressions: [
        'coup dur', 'mauvais augure', 'nuages à l\'horizon', 'vent contraire',
        'temps difficiles', 'période sombre', 'mauvaise passe', 'crise majeure',
        'au plus mal', 'dans le rouge', 'en difficulté', 'en perdition',
        'coup de tonnerre', 'chute libre', 'dégringolade', 'débâcle'
      ]
    },
    // Modificateurs d'intensité étendus
    intensifiers: [
      'très', 'extrêmement', 'particulièrement', 'vraiment', 'absolument',
      'complètement', 'totalement', 'énormément', 'considérablement',
      'incroyablement', 'extraordinairement', 'exceptionnellement',
      'remarquablement', 'singulièrement', 'prodigieusement',
      'infiniment', 'immensément', 'follement', 'terriblement',
      'diablement', 'sacrément', 'rudement', 'bigrement',
      'ultra', 'hyper', 'super', 'méga', 'archi', 'extra',
      'ô combien', 'au plus haut point', 'par excellence'
    ],
    diminishers: [
      'peu', 'légèrement', 'faiblement', 'modérément', 'relativement',
      'assez', 'plutôt', 'quelque peu', 'un peu', 'à peine',
      'presque pas', 'guère', 'à peine', 'vaguement',
      'timidement', 'mollement', 'discrètement', 'subtilement',
      'partiellement', 'incomplètement', 'imparfaitement',
      'dans une certaine mesure', 'jusqu\'à un certain point',
      'plus ou moins', 'en partie', 'en quelque sorte'
    ],
    // Négations complexes
    complex_negations: [
      'ne pas', 'n\'est pas', 'n\'a pas', 'ne sont pas', 'n\'ont pas',
      'jamais', 'aucun', 'aucune', 'sans', 'ni', 'nul', 'nulle',
      'point', 'nullement', 'aucunement', 'en aucun cas',
      'loin de', 'bien loin de', 'tout sauf', 'rien moins que',
      'contrairement à', 'à l\'opposé de', 'à l\'inverse de'
    ],
    // Indicateurs temporels pour pondération
    temporal_indicators: {
      recent: ['aujourd\'hui', 'hier', 'récemment', 'dernièrement', 'actuellement'],
      ongoing: ['en cours', 'en train de', 'présentement', 'maintenant'],
      future: ['demain', 'bientôt', 'prochainement', 'à venir', 'futur'],
      past: ['autrefois', 'jadis', 'anciennement', 'précédemment']
    }
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
    contextualFactors?: {
      titleWeight: number;
      contentWeight: number;
      temporalRelevance: number;
      linguisticComplexity: number;
      emotionalNuance: string[];
    };
  } {
    const titleText = article.title.toLowerCase();
    const contentText = article.content.toLowerCase();
    const summaryText = (article.summary || '').toLowerCase();
    const fullText = `${titleText} ${contentText} ${summaryText}`;
    
    let positiveScore = 0;
    let negativeScore = 0;
    let emotionWords: string[] = [];
    
    // Analyse contextuelle avancée
    const contextualAnalysis = this.performContextualAnalysis(titleText, contentText, summaryText);
    
    // Analyse sémantique pour enrichir l'analyse
    const semanticAnalysis = this.semanticAnalyzer.analyzeText(fullText);
    
    // Scores séparés par section avec pondération différentielle
    const titleAnalysis = this.analyzeSectionSentiment(titleText, 3.0); // Titre plus important
    const contentAnalysis = this.analyzeSectionSentiment(contentText, 1.0); // Poids normal
    const summaryAnalysis = this.analyzeSectionSentiment(summaryText, 2.0); // Résumé important
    
    // Combiner les analyses par section
    positiveScore = titleAnalysis.positive + contentAnalysis.positive + summaryAnalysis.positive;
    negativeScore = titleAnalysis.negative + contentAnalysis.negative + summaryAnalysis.negative;
    emotionWords = [...titleAnalysis.emotions, ...contentAnalysis.emotions, ...summaryAnalysis.emotions];
    
    // Analyse des expressions contextuelles
    const expressionAnalysis = this.analyzeContextualExpressions(fullText);
    positiveScore += expressionAnalysis.positive;
    negativeScore += expressionAnalysis.negative;
    emotionWords.push(...expressionAnalysis.emotions);
    
    // Analyse contextuelle pour détecter les négations
    const { positiveAdjusted, negativeAdjusted } = this.adjustForNegations(fullText, positiveScore, negativeScore);
    
    // Appliquer les facteurs contextuels
    const temporalWeight = contextualAnalysis.temporalRelevance;
    const complexityWeight = Math.min(1.2, 1 + contextualAnalysis.linguisticComplexity * 0.3);
    
    let finalPositiveScore = positiveAdjusted * temporalWeight * complexityWeight;
    let finalNegativeScore = negativeAdjusted * temporalWeight * complexityWeight;
    
    // Ajustement pour les nuances émotionnelles
    if (contextualAnalysis.emotionalNuance.includes('ironie')) {
      // L'ironie inverse souvent le sentiment apparent
      [finalPositiveScore, finalNegativeScore] = [finalNegativeScore * 0.7, finalPositiveScore * 0.7];
    }
    
    if (contextualAnalysis.emotionalNuance.includes('ambivalence')) {
      // L'ambivalence réduit l'intensité des sentiments
      finalPositiveScore *= 0.8;
      finalNegativeScore *= 0.8;
    }
    
    if (contextualAnalysis.emotionalNuance.includes('incertitude')) {
      // L'incertitude réduit la confiance
      finalPositiveScore *= 0.9;
      finalNegativeScore *= 0.9;
    }
    
    // Calcul du score final normalisé
    const totalScore = finalPositiveScore + finalNegativeScore;
    const rawScore = totalScore === 0 ? 0 : (finalPositiveScore - finalNegativeScore) / Math.max(totalScore, 1);
    
    // Score final entre -1 et 1
    let score = Math.max(-1, Math.min(1, rawScore));
    
    // Confiance basée sur plusieurs facteurs contextuels
    const keywordCount = emotionWords.length;
    const textLength = fullText.split(' ').length;
    const structuralComplexity = contextualAnalysis.structuralPatterns.length;
    
    let confidence = Math.min(
      (keywordCount / 15) * 0.4 + 
      (Math.min(textLength, 200) / 200) * 0.3 +
      (structuralComplexity / 5) * 0.1 +
      (contextualAnalysis.linguisticComplexity) * 0.2, 
      1
    );
    
    // Réduire la confiance en cas d'incertitude ou d'ambivalence
    if (contextualAnalysis.emotionalNuance.includes('incertitude')) {
      confidence *= 0.8;
    }
    if (contextualAnalysis.emotionalNuance.includes('ambivalence')) {
      confidence *= 0.7;
    }
    
    // Détermination du sentiment avec seuils adaptatifs contextuels
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const baseThreshold = 0.12;
    const confidenceAdjustment = confidence * 0.08;
    const urgencyBoost = contextualAnalysis.emotionalNuance.includes('urgence') ? 0.05 : 0;
    const threshold = baseThreshold - confidenceAdjustment + urgencyBoost;
    
    if (Math.abs(score) > threshold) {
      sentiment = score > 0 ? 'positive' : 'negative';
    }
    
    // Détermination de l'intensité avec facteurs contextuels
    let intensity: 'low' | 'medium' | 'high' = 'low';
    const absScore = Math.abs(score);
    const intensityThresholds = {
      high: 0.55 - (contextualAnalysis.linguisticComplexity * 0.1),
      medium: 0.25 - (contextualAnalysis.linguisticComplexity * 0.05)
    };
    
    if (absScore > intensityThresholds.high) intensity = 'high';
    else if (absScore > intensityThresholds.medium) intensity = 'medium';
    
    // Ajustements basés sur l'analyse sémantique
    const semanticBoost = this.calculateSemanticBoost(semanticAnalysis);
    score *= semanticBoost.scoreMultiplier;
    confidence *= semanticBoost.confidenceMultiplier;
    
    // Facteurs contextuels pour le retour avec données sémantiques
    const contextualFactors = {
      titleWeight: titleAnalysis.positive + titleAnalysis.negative,
      contentWeight: contentAnalysis.positive + contentAnalysis.negative,
      temporalRelevance: contextualAnalysis.temporalRelevance,
      linguisticComplexity: contextualAnalysis.linguisticComplexity,
      emotionalNuance: contextualAnalysis.emotionalNuance,
      semanticEntities: semanticAnalysis.entities.length,
      semanticDensity: semanticAnalysis.semanticDensity,
      topicSentiments: semanticAnalysis.topicSentiments,
      keyPhrases: semanticAnalysis.keyPhrases
    };
    
    return { 
      sentiment, 
      score, 
      confidence, 
      emotions: emotionWords.slice(0, 8), // Plus d'émotions détectées
      intensity,
      contextualFactors
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
    const negationWords = this.sentimentKeywords.complex_negations;
    const sentences = text.split(/[.!?;]/);
    
    let positiveAdjusted = positiveScore;
    let negativeAdjusted = negativeScore;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const hasNegation = negationWords.some(neg => {
        // Recherche plus sophistiquée incluant les variations
        return lowerSentence.includes(neg.toLowerCase());
      });
      
      if (hasNegation) {
        // Analyse plus fine des négations
        const sentencePositive = this.countPositiveWords(lowerSentence);
        const sentenceNegative = this.countNegativeWords(lowerSentence);
        
        // Détecter les doubles négations qui peuvent inverser le sens
        const negationCount = negationWords.filter(neg => 
          lowerSentence.includes(neg.toLowerCase())
        ).length;
        
        const inversionFactor = negationCount % 2 === 1 ? -1 : 1;
        
        if (sentencePositive > sentenceNegative) {
          if (inversionFactor === -1) {
            // Négation simple: inverser partiellement
            positiveAdjusted -= sentencePositive * 0.8;
            negativeAdjusted += sentencePositive * 0.4;
          } else {
            // Double négation: renforcer le positif
            positiveAdjusted += sentencePositive * 0.2;
          }
        } else if (sentenceNegative > sentencePositive) {
          if (inversionFactor === -1) {
            // Négation d'un sentiment négatif -> positif
            negativeAdjusted -= sentenceNegative * 0.8;
            positiveAdjusted += sentenceNegative * 0.4;
          } else {
            // Double négation: renforcer le négatif
            negativeAdjusted += sentenceNegative * 0.2;
          }
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

  /**
   * Analyse contextuelle avancée du texte
   */
  private performContextualAnalysis(title: string, content: string, summary: string): {
    temporalRelevance: number;
    linguisticComplexity: number;
    emotionalNuance: string[];
    structuralPatterns: string[];
  } {
    const fullText = `${title} ${content} ${summary}`;
    
    // Analyse temporelle
    const temporalRelevance = this.calculateTemporalRelevance(fullText);
    
    // Complexité linguistique
    const linguisticComplexity = this.calculateLinguisticComplexity(fullText);
    
    // Nuances émotionnelles
    const emotionalNuance = this.detectEmotionalNuances(fullText);
    
    // Motifs structurels
    const structuralPatterns = this.detectStructuralPatterns(fullText);
    
    return {
      temporalRelevance,
      linguisticComplexity,
      emotionalNuance,
      structuralPatterns
    };
  }

  /**
   * Analyse le sentiment d'une section de texte avec pondération
   */
  private analyzeSectionSentiment(text: string, weight: number): {
    positive: number;
    negative: number;
    emotions: string[];
  } {
    if (!text.trim()) {
      return { positive: 0, negative: 0, emotions: [] };
    }
    
    let positiveScore = 0;
    let negativeScore = 0;
    const emotions: string[] = [];
    
    // Analyse des sentiments positifs
    Object.entries(this.sentimentKeywords.positive).forEach(([intensity, keywords]) => {
      if (intensity === 'strong' || intensity === 'moderate' || intensity === 'weak') {
        const intensityWeight = intensity === 'strong' ? 3 : intensity === 'moderate' ? 2 : 1;
        (keywords as string[]).forEach(keyword => {
          const matches = this.findKeywordMatches(text, keyword);
          if (matches.length > 0) {
            emotions.push(keyword);
            matches.forEach(match => {
              let baseScore = intensityWeight * weight;
              
              // Appliquer les modificateurs contextuels
              baseScore = this.applyContextualModifiers(text, match, baseScore);
              
              // Pondération par position dans la phrase
              baseScore *= this.calculatePositionalWeight(text, match.index);
              
              positiveScore += baseScore;
            });
          }
        });
      }
    });
    
    // Analyse des sentiments négatifs (même logique)
    Object.entries(this.sentimentKeywords.negative).forEach(([intensity, keywords]) => {
      if (intensity === 'strong' || intensity === 'moderate' || intensity === 'weak') {
        const intensityWeight = intensity === 'strong' ? 3 : intensity === 'moderate' ? 2 : 1;
        (keywords as string[]).forEach(keyword => {
          const matches = this.findKeywordMatches(text, keyword);
          if (matches.length > 0) {
            emotions.push(keyword);
            matches.forEach(match => {
              let baseScore = intensityWeight * weight;
              
              baseScore = this.applyContextualModifiers(text, match, baseScore);
              baseScore *= this.calculatePositionalWeight(text, match.index);
              
              negativeScore += baseScore;
            });
          }
        });
      }
    });
    
    return { positive: positiveScore, negative: negativeScore, emotions };
  }

  /**
   * Trouve les correspondances d'un mot-clé avec informations contextuelles
   */
  private findKeywordMatches(text: string, keyword: string): Array<{index: number, match: string, context: string}> {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(text.length, match.index + keyword.length + 50);
      const context = text.slice(contextStart, contextEnd);
      
      matches.push({
        index: match.index,
        match: match[0],
        context
      });
    }
    
    return matches;
  }

  /**
   * Applique les modificateurs contextuels (intensificateurs, diminutifs, négations)
   */
  private applyContextualModifiers(text: string, match: {index: number, match: string, context: string}, baseScore: number): number {
    const context = match.context.toLowerCase();
    let score = baseScore;
    
    // Vérifier les intensificateurs
    const hasIntensifier = this.sentimentKeywords.intensifiers.some(intensifier => 
      context.includes(intensifier.toLowerCase())
    );
    
    // Vérifier les diminutifs
    const hasDiminisher = this.sentimentKeywords.diminishers.some(diminisher => 
      context.includes(diminisher.toLowerCase())
    );
    
    // Vérifier les négations
    const hasNegation = this.sentimentKeywords.complex_negations.some(negation => 
      context.includes(negation.toLowerCase())
    );
    
    if (hasIntensifier && !hasNegation) {
      score *= 1.7; // Intensification plus forte
    } else if (hasDiminisher && !hasNegation) {
      score *= 0.6; // Diminution plus marquée
    }
    
    if (hasNegation) {
      // Inverser le score et réduire l'intensité
      score *= -0.8;
    }
    
    return score;
  }

  /**
   * Calcule la pondération positionnelle du mot dans le texte
   */
  private calculatePositionalWeight(text: string, position: number): number {
    const textLength = text.length;
    const relativePosition = position / textLength;
    
    // Les mots au début et à la fin ont plus de poids
    if (relativePosition < 0.2 || relativePosition > 0.8) {
      return 1.3;
    } else if (relativePosition < 0.4 || relativePosition > 0.6) {
      return 1.1;
    }
    
    return 1.0;
  }

  /**
   * Analyse les expressions contextuelles idiomatiques
   */
  private analyzeContextualExpressions(text: string): {
    positive: number;
    negative: number;
    emotions: string[];
  } {
    let positive = 0;
    let negative = 0;
    const emotions: string[] = [];
    
    // Vérifier les expressions positives
    this.sentimentKeywords.contextual.positive_expressions.forEach(expression => {
      if (text.includes(expression)) {
        positive += 2.5; // Les expressions ont un poids important
        emotions.push(expression);
      }
    });
    
    // Vérifier les expressions négatives
    this.sentimentKeywords.contextual.negative_expressions.forEach(expression => {
      if (text.includes(expression)) {
        negative += 2.5;
        emotions.push(expression);
      }
    });
    
    return { positive, negative, emotions };
  }

  /**
   * Calcule la pertinence temporelle du texte
   */
  private calculateTemporalRelevance(text: string): number {
    let relevance = 1.0;
    
    // Indicateurs temporels récents augmentent la pertinence
    if (this.sentimentKeywords.temporal_indicators.recent.some(indicator => 
      text.includes(indicator)
    )) {
      relevance += 0.3;
    }
    
    // Indicateurs en cours augmentent encore plus
    if (this.sentimentKeywords.temporal_indicators.ongoing.some(indicator => 
      text.includes(indicator)
    )) {
      relevance += 0.5;
    }
    
    return Math.min(relevance, 2.0);
  }

  /**
   * Calcule la complexité linguistique
   */
  private calculateLinguisticComplexity(text: string): number {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    
    // Longueur moyenne des mots
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Longueur moyenne des phrases
    const avgSentenceLength = words.length / sentences.length;
    
    // Variété lexicale (ratio mots uniques / total)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // Score de complexité composé
    return (avgWordLength / 10) * 0.3 + 
           (avgSentenceLength / 20) * 0.4 + 
           lexicalDiversity * 0.3;
  }

  /**
   * Détecte les nuances émotionnelles complexes
   */
  private detectEmotionalNuances(text: string): string[] {
    const nuances: string[] = [];
    
    // Détection d'ironie/sarcasme (motifs basiques)
    if (/quelle surprise|bien sûr|évidemment|comme c'est étonnant/.test(text)) {
      nuances.push('ironie');
    }
    
    // Détection d'ambivalence (sentiments mixtes)
    const positiveCount = this.countPositiveWords(text);
    const negativeCount = this.countNegativeWords(text);
    if (positiveCount > 0 && negativeCount > 0 && Math.abs(positiveCount - negativeCount) <= 2) {
      nuances.push('ambivalence');
    }
    
    // Détection d'incertitude
    if (/peut-être|probablement|sans doute|il semblerait|on dit que/.test(text)) {
      nuances.push('incertitude');
    }
    
    // Détection d'urgence
    if (/urgent|immédiat|rapidement|tout de suite|sans délai/.test(text)) {
      nuances.push('urgence');
    }
    
    return nuances;
  }

  /**
   * Détecte les motifs structurels du texte
   */
  private detectStructuralPatterns(text: string): string[] {
    const patterns: string[] = [];
    
    // Questions rhétoriques
    if (/\?.*\?/.test(text) || text.split('?').length > 2) {
      patterns.push('questions_multiples');
    }
    
    // Listes ou énumérations
    if (/\d+[.)]/g.test(text) || text.split(',').length > 4) {
      patterns.push('enumeration');
    }
    
    // Citations
    if (text.includes('"') || text.includes('«') || text.includes('selon')) {
      patterns.push('citations');
    }
    
    // Comparaisons
    if (/comme|tel que|à l'instar de|contrairement à|par rapport à/.test(text)) {
      patterns.push('comparaisons');
    }
    
    return patterns;
  }

  /**
   * Calcule l'ajustement du score basé sur l'analyse sémantique
   */
  private calculateSemanticBoost(semanticAnalysis: {
    entities: SemanticEntity[];
    relations: SemanticRelation[];
    topicSentiments: TopicSentiment[];
    keyPhrases: string[];
    semanticDensity: number;
  }): { scoreMultiplier: number; confidenceMultiplier: number } {
    let scoreMultiplier = 1.0;
    let confidenceMultiplier = 1.0;
    
    // Boost basé sur la densité sémantique
    if (semanticAnalysis.semanticDensity > 0.3) {
      confidenceMultiplier += 0.1; // Texte plus riche sémantiquement = plus fiable
    }
    
    // Boost basé sur les entités de haut niveau (personnalités, organisations importantes)
    const highProfileEntities = semanticAnalysis.entities.filter(entity => 
      entity.confidence > 0.8 && 
      (entity.type === 'person' || entity.type === 'organization')
    );
    
    if (highProfileEntities.length > 0) {
      scoreMultiplier += highProfileEntities.length * 0.05;
      confidenceMultiplier += 0.1;
    }
    
    // Ajustement basé sur les sentiments des sujets
    const strongTopicSentiments = semanticAnalysis.topicSentiments.filter(ts => 
      ts.positive + ts.negative > 2 && ts.dominantSentiment !== 'neutral'
    );
    
    if (strongTopicSentiments.length > 0) {
      // Renforcer le sentiment si plusieurs sujets ont des sentiments cohérents
      const positiveTopics = strongTopicSentiments.filter(ts => ts.dominantSentiment === 'positive');
      const negativeTopics = strongTopicSentiments.filter(ts => ts.dominantSentiment === 'negative');
      
      if (positiveTopics.length > negativeTopics.length) {
        scoreMultiplier = scoreMultiplier > 1 ? scoreMultiplier * 1.1 : Math.max(scoreMultiplier * 1.1, 1.05);
      } else if (negativeTopics.length > positiveTopics.length) {
        scoreMultiplier = scoreMultiplier < 1 ? scoreMultiplier * 1.1 : Math.min(scoreMultiplier * 1.1, 0.95);
      }
      
      confidenceMultiplier += 0.05;
    }
    
    // Ajustement basé sur les relations sémantiques
    const strongRelations = semanticAnalysis.relations.filter(rel => rel.strength > 0.6);
    if (strongRelations.length > 0) {
      confidenceMultiplier += Math.min(strongRelations.length * 0.02, 0.1);
      
      // Si les relations montrent un sentiment dominant cohérent
      const positiveRelations = strongRelations.filter(rel => rel.sentiment === 'positive');
      const negativeRelations = strongRelations.filter(rel => rel.sentiment === 'negative');
      
      if (positiveRelations.length > negativeRelations.length + 1) {
        scoreMultiplier *= 1.05;
      } else if (negativeRelations.length > positiveRelations.length + 1) {
        scoreMultiplier *= 0.95;
      }
    }
    
    // Limites de sécurité
    scoreMultiplier = Math.max(0.8, Math.min(1.3, scoreMultiplier));
    confidenceMultiplier = Math.max(0.9, Math.min(1.2, confidenceMultiplier));
    
    return { scoreMultiplier, confidenceMultiplier };
  }

  /**
   * Analyse sémantique et reconnaissance d'entités nommées
   */
  private performSemanticAnalysis(text: string): {
    entities: {
      persons: string[];
      places: string[];
      organizations: string[];
      topics: string[];
    };
    semanticRelations: Array<{
      subject: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      object: string;
      strength: number;
    }>;
    topicSentiments: { [topic: string]: { positive: number; negative: number; }};
  } {
    const entities = {
      persons: this.extractPersonEntities(text),
      places: this.extractPlaceEntities(text),
      organizations: this.extractOrganizationEntities(text),
      topics: this.extractTopicEntities(text)
    };
    
    const semanticRelations = this.extractSemanticRelations(text, entities);
    const topicSentiments = this.analyzeTopicSentiments(text, entities.topics);
    
    return { entities, semanticRelations, topicSentiments };
  }

  /**
   * Extraction des entités personnes (nom propres, titres, etc.)
   */
  private extractPersonEntities(text: string): string[] {
    const persons = new Set<string>();
    
    // Titres officiels français
    const titles = [
      'président', 'ministre', 'premier ministre', 'secrétaire d\'état',
      'maire', 'gouverneur', 'ambassadeur', 'consul', 'préfet',
      'directeur', 'pdg', 'ceo', 'dg', 'directeur général',
      'professeur', 'docteur', 'maître', 'avocat',
      'capitaine', 'colonel', 'général', 'amiral'
    ];
    
    // Recherche de motifs nom + titre
    titles.forEach(title => {
      const titleRegex = new RegExp(`(?:${title})\\s+([A-Z][a-zà-ÿ]+(?:\\s+[A-Z][a-zà-ÿ]+)*)`, 'gi');
      const matches = text.match(titleRegex);
      if (matches) {
        matches.forEach(match => {
          const name = match.replace(new RegExp(title, 'i'), '').trim();
          if (name.length > 2) persons.add(name);
        });
      }
    });
    
    // Noms propres isolés (basique)
    const namePattern = /\b[A-Z][a-zà-ÿ]+\s+[A-Z][a-zà-ÿ]+\b/g;
    const nameMatches = text.match(namePattern);
    if (nameMatches) {
      nameMatches.forEach(name => {
        if (!this.isCommonPhrase(name)) {
          persons.add(name);
        }
      });
    }
    
    return Array.from(persons).slice(0, 10);
  }

  /**
   * Extraction des entités lieux
   */
  private extractPlaceEntities(text: string): string[] {
    const places = new Set<string>();
    
    // Lieux français connus
    const knownPlaces = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
      'Montpellier', 'Bordeaux', 'Lille', 'France', 'Europe', 'Union européenne',
      'Île-de-France', 'Provence', 'Bretagne', 'Normandie', 'Alsace',
      'Élysée', 'Matignon', 'Assemblée nationale', 'Sénat'
    ];
    
    knownPlaces.forEach(place => {
      if (text.toLowerCase().includes(place.toLowerCase())) {
        places.add(place);
      }
    });
    
    // Motifs géographiques
    const geoPatterns = [
      /\b([A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)*)(?:\s+\([0-9]{2,3}\))?/g, // Villes avec département
      /\brégion\s+([A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)*)/gi,
      /\bdépartement\s+(?:d[eu]\s+)?([A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)*)/gi
    ];
    
    geoPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => places.add(match.trim()));
      }
    });
    
    return Array.from(places).slice(0, 8);
  }

  /**
   * Extraction des entités organisations
   */
  private extractOrganizationEntities(text: string): string[] {
    const orgs = new Set<string>();
    
    // Organisations françaises connues
    const knownOrgs = [
      'SNCF', 'EDF', 'Orange', 'Total', 'Renault', 'Peugeot', 'Airbus',
      'BNP Paribas', 'Crédit Agricole', 'Société Générale',
      'France Télévisions', 'Radio France', 'Arte', 'Canal+',
      'Université de la Sorbonne', 'Sciences Po', 'ENS',
      'Ministère', 'Cour de cassation', 'Conseil d\'État'
    ];
    
    knownOrgs.forEach(org => {
      if (text.includes(org)) {
        orgs.add(org);
      }
    });
    
    // Motifs organisationnels
    const orgPatterns = [
      /\b(Ministère\s+d[eu]\s+[A-Z][a-zà-ÿ\s]+)/gi,
      /\b(Agence\s+[A-Z][a-zà-ÿ\s]+)/gi,
      /\b(Fédération\s+[A-Z][a-zà-ÿ\s]+)/gi,
      /\b(Association\s+[A-Z][a-zà-ÿ\s]+)/gi,
      /\b(Syndicat\s+[A-Z][a-zà-ÿ\s]+)/gi
    ];
    
    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => orgs.add(match.trim()));
      }
    });
    
    return Array.from(orgs).slice(0, 8);
  }

  /**
   * Extraction des sujets/thèmes principaux
   */
  private extractTopicEntities(text: string): string[] {
    const topics = new Set<string>();
    
    // Thèmes d'actualité français
    const topicKeywords = {
      'politique': ['politique', 'gouvernement', 'élection', 'vote', 'démocratie', 'parlement'],
      'économie': ['économie', 'finance', 'entreprise', 'emploi', 'chômage', 'croissance'],
      'santé': ['santé', 'médecine', 'hôpital', 'covid', 'vaccin', 'traitement'],
      'éducation': ['éducation', 'école', 'université', 'formation', 'enseignement'],
      'environnement': ['environnement', 'climat', 'écologie', 'pollution', 'développement durable'],
      'technologie': ['technologie', 'intelligence artificielle', 'numérique', 'innovation'],
      'culture': ['culture', 'art', 'cinéma', 'théâtre', 'musique', 'littérature'],
      'sport': ['sport', 'football', 'rugby', 'tennis', 'jeux olympiques'],
      'international': ['international', 'europe', 'monde', 'diplomatique', 'relations'],
      'justice': ['justice', 'tribunal', 'procès', 'juridique', 'droit']
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        topics.add(topic);
      }
    });
    
    return Array.from(topics);
  }

  /**
   * Vérifie si une phrase est courante (pour éviter les faux positifs)
   */
  private isCommonPhrase(phrase: string): boolean {
    const commonPhrases = [
      'Le Monde', 'Le Figaro', 'La France', 'Les Français', 'La République',
      'Un Homme', 'Une Femme', 'Tout Le', 'Dans Le', 'Pour La'
    ];
    
    return commonPhrases.some(common => 
      phrase.toLowerCase() === common.toLowerCase()
    );
  }

  /**
   * Extrait les relations sémantiques entre entités et sentiments
   */
  private extractSemanticRelations(text: string, entities: any): Array<{
    subject: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    object: string;
    strength: number;
  }> {
    const relations: Array<{
      subject: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      object: string;
      strength: number;
    }> = [];
    
    const allEntities = [...entities.persons, ...entities.places, ...entities.organizations];
    
    // Recherche de relations simples entre entités et sentiments
    allEntities.forEach(entity => {
      const entityContext = this.extractEntityContext(text, entity);
      if (entityContext) {
        const sentiment = this.analyzeContextSentiment(entityContext);
        
        allEntities.forEach(otherEntity => {
          if (entity !== otherEntity && entityContext.includes(otherEntity.toLowerCase())) {
            relations.push({
              subject: entity,
              sentiment: sentiment.sentiment,
              object: otherEntity,
              strength: sentiment.confidence
            });
          }
        });
      }
    });
    
    return relations.slice(0, 20);
  }

  /**
   * Extrait le contexte autour d'une entité
   */
  private extractEntityContext(text: string, entity: string): string {
    const entityIndex = text.toLowerCase().indexOf(entity.toLowerCase());
    if (entityIndex === -1) return '';
    
    const contextStart = Math.max(0, entityIndex - 100);
    const contextEnd = Math.min(text.length, entityIndex + entity.length + 100);
    
    return text.slice(contextStart, contextEnd);
  }

  /**
   * Analyse le sentiment d'un contexte spécifique
   */
  private analyzeContextSentiment(context: string): { sentiment: 'positive' | 'negative' | 'neutral', confidence: number } {
    let positive = 0;
    let negative = 0;
    
    // Version simplifiée pour l'analyse contextuelle
    Object.values(this.sentimentKeywords.positive).forEach(keywords => {
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          if (context.toLowerCase().includes(keyword)) {
            positive++;
          }
        });
      }
    });
    
    Object.values(this.sentimentKeywords.negative).forEach(keywords => {
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          if (context.toLowerCase().includes(keyword)) {
            negative++;
          }
        });
      }
    });
    
    const total = positive + negative;
    const sentiment = total === 0 ? 'neutral' : (positive > negative ? 'positive' : 'negative');
    const confidence = total / Math.max(context.split(' ').length / 10, 1);
    
    return { sentiment, confidence: Math.min(confidence, 1) };
  }

  /**
   * Analyse le sentiment par sujet/thème
   */
  private analyzeTopicSentiments(text: string, topics: string[]): { [topic: string]: { positive: number; negative: number; }} {
    const topicSentiments: { [topic: string]: { positive: number; negative: number; }} = {};
    
    topics.forEach(topic => {
      topicSentiments[topic] = { positive: 0, negative: 0 };
      
      // Analyser le sentiment dans le contexte de ce sujet
      const sentences = text.split(/[.!?]/);
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes(topic)) {
          const sentimentAnalysis = this.analyzeContextSentiment(sentence);
          if (sentimentAnalysis.sentiment === 'positive') {
            topicSentiments[topic].positive += sentimentAnalysis.confidence;
          } else if (sentimentAnalysis.sentiment === 'negative') {
            topicSentiments[topic].negative += sentimentAnalysis.confidence;
          }
        }
      });
    });
    
    return topicSentiments;
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
