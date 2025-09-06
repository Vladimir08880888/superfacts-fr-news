import { Article } from './news-collector';
import {
  FactCheckResult,
  WarningFlag,
  CrossReference,
  SourceCredibility,
  FactCheckingStats,
  TRUSTED_FRENCH_SOURCES,
  FAKE_NEWS_INDICATORS
} from '@/types/fact-check';

export class FactChecker {
  private trustedSources: Map<string, SourceCredibility>;
  private checkedArticles: Map<string, FactCheckResult> = new Map();

  constructor() {
    // Initialiser la base de données des sources fiables
    this.trustedSources = new Map();
    TRUSTED_FRENCH_SOURCES.forEach(source => {
      this.trustedSources.set(source.domain, source);
    });
  }

  public async checkArticle(article: Article): Promise<FactCheckResult> {
    const timestamp = new Date().toISOString();
    
    // Vérifier si l'article a déjà été analysé récemment
    const existingCheck = this.checkedArticles.get(article.id);
    if (existingCheck) {
      const timeDiff = Date.now() - new Date(existingCheck.timestamp).getTime();
      if (timeDiff < 3600000) { // 1 heure
        return existingCheck;
      }
    }

    const warningFlags: WarningFlag[] = [];
    let credibilityScore = 100; // Commencer avec un score parfait

    // 1. Vérification de la source
    const sourceVerification = this.verifySource(article);
    credibilityScore *= (sourceVerification.sourceCredibilityScore / 100);

    // 2. Analyse du contenu
    const textAnalysis = this.analyzeText(article);
    credibilityScore *= (1 - textAnalysis.sensationalismScore / 100);

    // 3. Détection de drapeaux rouges
    const contentFlags = this.detectContentFlags(article);
    warningFlags.push(...contentFlags);

    // 4. Vérification des références croisées (simulé)
    const crossReferences = await this.findCrossReferences(article);

    // 5. Calcul du score final
    const flagPenalty = warningFlags.reduce((total, flag) => total + flag.score, 0);
    credibilityScore = Math.max(0, credibilityScore - flagPenalty);

    // 6. Détermination du niveau de risque
    const riskLevel = this.determineRiskLevel(credibilityScore, warningFlags);

    const result: FactCheckResult = {
      articleId: article.id,
      credibilityScore: Math.round(credibilityScore),
      riskLevel,
      sourcesVerification: sourceVerification,
      crossReferenceCount: crossReferences.length,
      crossReferences,
      warningFlags,
      textAnalysis,
      timestamp,
      lastVerified: timestamp
    };

    // Sauvegarder le résultat
    this.checkedArticles.set(article.id, result);

    return result;
  }

  private verifySource(article: Article): FactCheckResult['sourcesVerification'] {
    const domain = this.extractDomain(article.sourceUrl);
    const sourceData = this.trustedSources.get(domain);

    if (sourceData) {
      return {
        isReliableSource: !sourceData.blacklisted,
        sourceCredibilityScore: sourceData.credibilityScore,
        sourceBias: sourceData.bias,
        sourceHistory: {
          factualReporting: sourceData.factualReporting,
          controversyCount: 0, // Simulé
          corrections: 0 // Simulé
        }
      };
    }

    // Source non reconnue - score par défaut plus bas
    return {
      isReliableSource: false,
      sourceCredibilityScore: 60,
      sourceBias: 'unknown',
      sourceHistory: {
        factualReporting: 60,
        controversyCount: 0,
        corrections: 0
      }
    };
  }

  private analyzeText(article: Article): FactCheckResult['textAnalysis'] {
    const fullText = `${article.title} ${article.content} ${article.summary}`.toLowerCase();
    
    // 1. Analyse du langage émotionnel
    let emotionalScore = 0;
    FAKE_NEWS_INDICATORS.emotionalWords.forEach(word => {
      const matches = (fullText.match(new RegExp(word, 'gi')) || []).length;
      emotionalScore += matches * 10;
    });
    emotionalScore = Math.min(100, emotionalScore);

    // 2. Détection de clickbait
    let clickbaitScore = 0;
    FAKE_NEWS_INDICATORS.clickbaitPatterns.forEach(pattern => {
      if (pattern.test(fullText)) {
        clickbaitScore += 25;
      }
    });

    // 3. Analyse du sensationnalisme
    let sensationalismScore = 0;
    const sensationalWords = ['exclusif', 'révélation', 'choquant', 'scandaleux', 'secret'];
    sensationalWords.forEach(word => {
      if (fullText.includes(word)) {
        sensationalismScore += 15;
      }
    });
    sensationalismScore = Math.min(100, sensationalismScore);

    // 4. Comptage des affirmations factuelles (simulation)
    const factualClaimsCount = this.countFactualClaims(fullText);
    const verifiableFactsCount = Math.floor(factualClaimsCount * 0.7); // 70% supposés vérifiables

    return {
      emotionalLanguageScore: Math.min(100, emotionalScore),
      clickbaitIndicators: Math.min(100, clickbaitScore),
      sensationalismScore,
      factualClaimsCount,
      verifiableFactsCount
    };
  }

  private detectContentFlags(article: Article): WarningFlag[] {
    const flags: WarningFlag[] = [];
    const fullText = `${article.title} ${article.content}`.toLowerCase();

    // 1. Vérification du clickbait
    FAKE_NEWS_INDICATORS.clickbaitPatterns.forEach(pattern => {
      if (pattern.test(fullText)) {
        flags.push({
          type: 'content',
          severity: 'medium',
          description: 'Titre susceptible d\'être du clickbait',
          details: 'Le titre utilise des techniques de clickbait pour attirer l\'attention',
          score: 15
        });
      }
    });

    // 2. Vérification du langage non fiable
    FAKE_NEWS_INDICATORS.unreliableLanguage.forEach(phrase => {
      if (fullText.includes(phrase)) {
        flags.push({
          type: 'content',
          severity: 'medium',
          description: 'Utilisation de langage non vérifiable',
          details: `Utilise des expressions comme "${phrase}" qui indiquent un manque de sources précises`,
          score: 10
        });
      }
    });

    // 3. Vérification de la structure de l'article
    if (article.content.length < 200) {
      flags.push({
        type: 'structure',
        severity: 'low',
        description: 'Article très court',
        details: 'L\'article est inhabituellement court, ce qui peut indiquer un manque de profondeur',
        score: 5
      });
    }

    // 4. Vérification de l'auteur
    if (!article.author || article.author.length < 3) {
      flags.push({
        type: 'source',
        severity: 'medium',
        description: 'Auteur non identifié',
        details: 'L\'article n\'a pas d\'auteur clairement identifié',
        score: 10
      });
    }

    // 5. Vérification de la date de publication
    const publishDate = new Date(article.publishDate);
    const now = new Date();
    const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff < 0) {
      flags.push({
        type: 'timing',
        severity: 'high',
        description: 'Date de publication future',
        details: 'L\'article semble avoir une date de publication dans le futur',
        score: 20
      });
    }

    return flags;
  }

  private async findCrossReferences(article: Article): Promise<CrossReference[]> {
    // Simulation de références croisées
    // Dans une vraie implémentation, cela interrogerait d'autres sources
    const crossReferences: CrossReference[] = [];
    
    // Simuler quelques références croisées basées sur la source
    const domain = this.extractDomain(article.sourceUrl);
    const sourceCredibility = this.trustedSources.get(domain);
    
    if (sourceCredibility && sourceCredibility.credibilityScore > 80) {
      // Sources fiables ont généralement plus de références croisées
      crossReferences.push(
        {
          sourceUrl: 'https://www.lemonde.fr/reference-article',
          sourceName: 'Le Monde',
          similarity: 85,
          agreement: 'confirms',
          credibility: 92
        },
        {
          sourceUrl: 'https://www.francetvinfo.fr/reference-article',
          sourceName: 'France Info',
          similarity: 78,
          agreement: 'confirms',
          credibility: 93
        }
      );
    } else {
      // Sources moins fiables ont moins de références
      crossReferences.push({
        sourceUrl: 'https://example-news.fr/reference',
        sourceName: 'Source Alternative',
        similarity: 45,
        agreement: 'partial',
        credibility: 60
      });
    }

    return crossReferences;
  }

  private countFactualClaims(text: string): number {
    // Compter les affirmations qui ressemblent à des faits
    const factPatterns = [
      /\d+%/g, // Pourcentages
      /\d+ (personnes|euros|millions|milliards)/g, // Chiffres avec unités
      /selon .+/g, // Citations de sources
      /\d{4}/ // Années
    ];

    let claimsCount = 0;
    factPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        claimsCount += matches.length;
      }
    });

    return claimsCount;
  }

  private determineRiskLevel(score: number, flags: WarningFlag[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFlags = flags.filter(f => f.severity === 'critical').length;
    const highFlags = flags.filter(f => f.severity === 'high').length;

    if (score < 30 || criticalFlags > 0) return 'critical';
    if (score < 50 || highFlags > 1) return 'high';
    if (score < 70 || flags.length > 3) return 'medium';
    return 'low';
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  public getStats(): FactCheckingStats {
    const checkedArticles = Array.from(this.checkedArticles.values());
    const totalArticles = checkedArticles.length;

    if (totalArticles === 0) {
      return {
        totalArticlesChecked: 0,
        averageCredibilityScore: 0,
        highRiskArticles: 0,
        flaggedSources: 0,
        mostCommonFlags: [],
        credibilityDistribution: { high: 0, medium: 0, low: 0, critical: 0 }
      };
    }

    const averageScore = checkedArticles.reduce((sum, result) => sum + result.credibilityScore, 0) / totalArticles;
    const highRiskArticles = checkedArticles.filter(result => 
      result.riskLevel === 'high' || result.riskLevel === 'critical'
    ).length;

    // Distribution de crédibilité
    const distribution = { high: 0, medium: 0, low: 0, critical: 0 };
    checkedArticles.forEach(result => {
      if (result.credibilityScore >= 80) distribution.high++;
      else if (result.credibilityScore >= 50) distribution.medium++;
      else if (result.credibilityScore >= 20) distribution.low++;
      else distribution.critical++;
    });

    // Flags les plus communs
    const flagCounts: { [key: string]: number } = {};
    checkedArticles.forEach(result => {
      result.warningFlags.forEach(flag => {
        const key = `${flag.type}-${flag.description}`;
        flagCounts[key] = (flagCounts[key] || 0) + 1;
      });
    });

    const mostCommonFlags = Object.entries(flagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      totalArticlesChecked: totalArticles,
      averageCredibilityScore: Math.round(averageScore),
      highRiskArticles,
      flaggedSources: new Set(checkedArticles.map(r => this.extractDomain(r.articleId))).size,
      mostCommonFlags,
      credibilityDistribution: distribution
    };
  }

  public addTrustedSource(source: SourceCredibility): void {
    this.trustedSources.set(source.domain, source);
  }

  public updateSourceCredibility(domain: string, updates: Partial<SourceCredibility>): void {
    const existing = this.trustedSources.get(domain);
    if (existing) {
      this.trustedSources.set(domain, { ...existing, ...updates, lastUpdated: new Date().toISOString() });
    }
  }
}
