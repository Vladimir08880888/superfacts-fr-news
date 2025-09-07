/**
 * Système de validation et calibration pour l'analyse de sentiment
 * Implémente des métriques de qualité et des tests de cohérence
 */

import { Article } from './news-collector';

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  coherenceIndex: number;
  confidence: number;
}

export interface CalibrationResult {
  isCalibrated: boolean;
  adjustmentFactor: number;
  recommendedThreshold: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
}

export interface SentimentConsistency {
  temporalConsistency: number;
  sourceConsistency: number;
  topicConsistency: number;
  overallConsistency: number;
}

export class SentimentValidator {
  private validationHistory: Array<{
    timestamp: Date;
    metrics: ValidationMetrics;
    sampleSize: number;
  }> = [];

  private consistencyBenchmarks = {
    temporal: 0.7,    // Cohérence temporelle minimale
    source: 0.6,      // Cohérence par source minimale
    topic: 0.8,       // Cohérence par sujet minimale
    overall: 0.7      // Cohérence globale minimale
  };

  /**
   * Valide la qualité de l'analyse de sentiment sur un échantillon
   */
  public validateSentimentAnalysis(
    articles: Article[],
    analysisResults: Array<{
      articleId: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
    }>
  ): ValidationMetrics {
    // Validation croisée avec des références connues
    const crossValidation = this.performCrossValidation(articles, analysisResults);
    
    // Test de cohérence interne
    const coherence = this.calculateCoherenceIndex(articles, analysisResults);
    
    // Mesure de la confiance globale
    const overallConfidence = analysisResults.reduce((sum, result) => 
      sum + result.confidence, 0) / analysisResults.length;

    const metrics: ValidationMetrics = {
      accuracy: crossValidation.accuracy,
      precision: crossValidation.precision,
      recall: crossValidation.recall,
      f1Score: crossValidation.f1Score,
      coherenceIndex: coherence,
      confidence: overallConfidence
    };

    // Enregistrer les métriques
    this.validationHistory.push({
      timestamp: new Date(),
      metrics,
      sampleSize: articles.length
    });

    return metrics;
  }

  /**
   * Calibre le système basé sur l'historique de performance
   */
  public calibrateSystem(): CalibrationResult {
    if (this.validationHistory.length < 3) {
      return {
        isCalibrated: false,
        adjustmentFactor: 1.0,
        recommendedThreshold: 0.15,
        qualityScore: 0.5,
        issues: ['Historique insuffisant pour la calibration'],
        suggestions: ['Collecter plus de données de validation']
      };
    }

    const recentMetrics = this.validationHistory.slice(-10); // 10 dernières validations
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.metrics.accuracy, 0) / recentMetrics.length;
    const avgCoherence = recentMetrics.reduce((sum, m) => sum + m.metrics.coherenceIndex, 0) / recentMetrics.length;
    const avgConfidence = recentMetrics.reduce((sum, m) => sum + m.metrics.confidence, 0) / recentMetrics.length;

    const qualityScore = (avgAccuracy * 0.4 + avgCoherence * 0.3 + avgConfidence * 0.3);
    
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Identifier les problèmes
    if (avgAccuracy < 0.7) {
      issues.push('Précision insuffisante');
      suggestions.push('Revoir les seuils de classification');
    }
    
    if (avgCoherence < 0.6) {
      issues.push('Cohérence faible');
      suggestions.push('Améliorer les algorithmes de détection contextuelle');
    }

    if (avgConfidence < 0.5) {
      issues.push('Confiance faible');
      suggestions.push('Enrichir le dictionnaire émotionnel');
    }

    // Calculer le facteur d'ajustement
    let adjustmentFactor = 1.0;
    if (avgAccuracy < 0.8) {
      adjustmentFactor = 0.9; // Réduire les scores pour être plus conservateur
    } else if (avgAccuracy > 0.9) {
      adjustmentFactor = 1.1; // Augmenter légèrement les scores
    }

    // Seuil recommandé basé sur les performances
    const recommendedThreshold = Math.max(0.1, Math.min(0.25, 0.2 - (avgAccuracy - 0.7) * 0.1));

    return {
      isCalibrated: qualityScore > 0.7,
      adjustmentFactor,
      recommendedThreshold,
      qualityScore,
      issues,
      suggestions
    };
  }

  /**
   * Teste la cohérence des sentiments
   */
  public testConsistency(
    articles: Article[],
    analysisResults: Array<{
      articleId: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
    }>
  ): SentimentConsistency {
    const temporalConsistency = this.testTemporalConsistency(articles, analysisResults);
    const sourceConsistency = this.testSourceConsistency(articles, analysisResults);
    const topicConsistency = this.testTopicConsistency(articles, analysisResults);
    
    const overallConsistency = (temporalConsistency + sourceConsistency + topicConsistency) / 3;

    return {
      temporalConsistency,
      sourceConsistency,
      topicConsistency,
      overallConsistency
    };
  }

  /**
   * Génère un rapport de qualité détaillé
   */
  public generateQualityReport(): {
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    metrics: ValidationMetrics | null;
    trends: {
      accuracy: 'improving' | 'stable' | 'declining';
      coherence: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
  } {
    if (this.validationHistory.length === 0) {
      return {
        overallGrade: 'F',
        metrics: null,
        trends: { accuracy: 'stable', coherence: 'stable' },
        recommendations: ['Effectuer des tests de validation']
      };
    }

    const latestMetrics = this.validationHistory[this.validationHistory.length - 1].metrics;
    const overallScore = (latestMetrics.accuracy * 0.3 + 
                         latestMetrics.f1Score * 0.3 + 
                         latestMetrics.coherenceIndex * 0.2 + 
                         latestMetrics.confidence * 0.2);

    let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 0.9) overallGrade = 'A';
    else if (overallScore >= 0.8) overallGrade = 'B';
    else if (overallScore >= 0.7) overallGrade = 'C';
    else if (overallScore >= 0.6) overallGrade = 'D';
    else overallGrade = 'F';

    // Analyser les tendances
    const trends = this.analyzeTrends();
    
    // Générer des recommandations
    const recommendations = this.generateRecommendations(latestMetrics, overallScore);

    return {
      overallGrade,
      metrics: latestMetrics,
      trends,
      recommendations
    };
  }

  // Méthodes privées

  /**
   * Validation croisée avec échantillons de référence
   */
  private performCrossValidation(
    articles: Article[],
    results: Array<{ articleId: string; sentiment: string; score: number }>
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // Génération d'échantillons de référence basés sur des heuristiques
    const referenceResults = this.generateReferenceResults(articles);
    
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    let correctPredictions = 0;

    results.forEach((result, index) => {
      const reference = referenceResults[index];
      if (!reference) return;

      const predicted = result.sentiment;
      const actual = reference.sentiment;

      if (predicted === actual) {
        correctPredictions++;
      }

      // Classification binaire pour les métriques (positive vs non-positive)
      const predictedPositive = predicted === 'positive';
      const actualPositive = actual === 'positive';

      if (predictedPositive && actualPositive) truePositives++;
      else if (predictedPositive && !actualPositive) falsePositives++;
      else if (!predictedPositive && !actualPositive) trueNegatives++;
      else if (!predictedPositive && actualPositive) falseNegatives++;
    });

    const accuracy = correctPredictions / results.length;
    const precision = truePositives / Math.max(truePositives + falsePositives, 1);
    const recall = truePositives / Math.max(truePositives + falseNegatives, 1);
    const f1Score = 2 * (precision * recall) / Math.max(precision + recall, 1);

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Génère des résultats de référence basés sur des heuristiques simples
   */
  private generateReferenceResults(articles: Article[]): Array<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    return articles.map(article => {
      const text = `${article.title} ${article.content}`.toLowerCase();
      
      // Mots-clés simples pour la référence
      const positiveWords = ['succès', 'victoire', 'excellent', 'bon', 'amélioration', 'croissance'];
      const negativeWords = ['échec', 'crise', 'problème', 'mauvais', 'chute', 'difficulté'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        positiveCount += (text.match(new RegExp(word, 'g')) || []).length;
      });
      
      negativeWords.forEach(word => {
        negativeCount += (text.match(new RegExp(word, 'g')) || []).length;
      });
      
      const sentiment = positiveCount > negativeCount ? 'positive' : 
                       negativeCount > positiveCount ? 'negative' : 'neutral';
      
      const confidence = Math.min((positiveCount + negativeCount) / (text.split(' ').length / 10), 1);
      
      return { sentiment, confidence };
    });
  }

  /**
   * Calcule l'index de cohérence
   */
  private calculateCoherenceIndex(
    articles: Article[],
    results: Array<{ sentiment: string; score: number; confidence: number }>
  ): number {
    if (results.length < 2) return 1;

    // Cohérence basée sur la stabilité des scores pour des articles similaires
    let coherenceSum = 0;
    let comparisons = 0;

    for (let i = 0; i < results.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 10, results.length); j++) {
        const similarity = this.calculateTextSimilarity(
          articles[i].title + ' ' + articles[i].content,
          articles[j].title + ' ' + articles[j].content
        );

        if (similarity > 0.3) { // Articles similaires
          const scoreDifference = Math.abs(results[i].score - results[j].score);
          const expectedDifference = (1 - similarity) * 0.5; // Différence attendue
          const coherence = Math.max(0, 1 - Math.abs(scoreDifference - expectedDifference) * 2);
          
          coherenceSum += coherence;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? coherenceSum / comparisons : 0.8;
  }

  /**
   * Calcule la similarité entre deux textes (Jaccard simplifiée)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Teste la cohérence temporelle
   */
  private testTemporalConsistency(
    articles: Article[],
    results: Array<{ sentiment: string; score: number }>
  ): number {
    // Grouper par périodes de temps et vérifier la stabilité
    const timeGroups: { [timeKey: string]: number[] } = {};
    
    articles.forEach((article, index) => {
      const timeKey = new Date(article.publishDate).toISOString().split('T')[0]; // Par jour
      if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
      timeGroups[timeKey].push(results[index].score);
    });

    let consistencySum = 0;
    let groupCount = 0;

    Object.values(timeGroups).forEach(scores => {
      if (scores.length > 1) {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
        const consistency = Math.max(0, 1 - variance); // Moins de variance = plus de cohérence
        consistencySum += consistency;
        groupCount++;
      }
    });

    return groupCount > 0 ? consistencySum / groupCount : 0.8;
  }

  /**
   * Teste la cohérence par source
   */
  private testSourceConsistency(
    articles: Article[],
    results: Array<{ sentiment: string; score: number }>
  ): number {
    const sourceGroups: { [source: string]: number[] } = {};
    
    articles.forEach((article, index) => {
      const source = article.source || 'unknown';
      if (!sourceGroups[source]) sourceGroups[source] = [];
      sourceGroups[source].push(results[index].score);
    });

    let consistencySum = 0;
    let groupCount = 0;

    Object.values(sourceGroups).forEach(scores => {
      if (scores.length > 2) { // Au moins 3 articles de la même source
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
        const consistency = Math.max(0, 1 - variance * 2); // Sources devraient être plus cohérentes
        consistencySum += consistency;
        groupCount++;
      }
    });

    return groupCount > 0 ? consistencySum / groupCount : 0.7;
  }

  /**
   * Teste la cohérence par sujet
   */
  private testTopicConsistency(
    articles: Article[],
    results: Array<{ sentiment: string; score: number }>
  ): number {
    const topicGroups: { [topic: string]: number[] } = {};
    
    articles.forEach((article, index) => {
      const topic = article.category || 'general';
      if (!topicGroups[topic]) topicGroups[topic] = [];
      topicGroups[topic].push(results[index].score);
    });

    let consistencySum = 0;
    let groupCount = 0;

    Object.values(topicGroups).forEach(scores => {
      if (scores.length > 1) {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
        const consistency = Math.max(0, 1 - variance * 1.5);
        consistencySum += consistency;
        groupCount++;
      }
    });

    return groupCount > 0 ? consistencySum / groupCount : 0.75;
  }

  /**
   * Analyse les tendances de performance
   */
  private analyzeTrends(): {
    accuracy: 'improving' | 'stable' | 'declining';
    coherence: 'improving' | 'stable' | 'declining';
  } {
    if (this.validationHistory.length < 3) {
      return { accuracy: 'stable', coherence: 'stable' };
    }

    const recent = this.validationHistory.slice(-5);
    const accuracyTrend = this.calculateTrend(recent.map(h => h.metrics.accuracy));
    const coherenceTrend = this.calculateTrend(recent.map(h => h.metrics.coherenceIndex));

    return {
      accuracy: accuracyTrend > 0.02 ? 'improving' : accuracyTrend < -0.02 ? 'declining' : 'stable',
      coherence: coherenceTrend > 0.02 ? 'improving' : coherenceTrend < -0.02 ? 'declining' : 'stable'
    };
  }

  /**
   * Calcule la tendance d'une série de valeurs
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Somme de 0, 1, 2, ..., n-1
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Génère des recommandations basées sur les métriques
   */
  private generateRecommendations(metrics: ValidationMetrics, overallScore: number): string[] {
    const recommendations: string[] = [];

    if (metrics.accuracy < 0.8) {
      recommendations.push('Améliorer la précision en affinant les seuils de classification');
    }

    if (metrics.coherenceIndex < 0.7) {
      recommendations.push('Renforcer la cohérence contextuelle avec plus d\'analyse sémantique');
    }

    if (metrics.confidence < 0.6) {
      recommendations.push('Enrichir le dictionnaire émotionnel et les patterns linguistiques');
    }

    if (metrics.f1Score < 0.7) {
      recommendations.push('Équilibrer précision et rappel avec des ajustements algorithmiques');
    }

    if (overallScore < 0.7) {
      recommendations.push('Révision complète du système recommandée');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance satisfaisante - continuer la surveillance');
    }

    return recommendations;
  }
}
