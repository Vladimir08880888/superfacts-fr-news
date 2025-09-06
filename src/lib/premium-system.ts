import { analytics } from './analytics-system';
import { Article } from './news-collector';

export type SubscriptionTier = 'free' | 'premium' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: string[];
  limits: {
    articlesPerDay: number;
    translationsPerDay: number;
    bookmarksMax: number;
    categoriesMax: number;
    exportFormats: string[];
    apiCallsPerMonth: number;
  };
  badge: {
    text: string;
    color: string;
    icon: string;
  };
}

export interface UserSubscription {
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  paymentMethod?: string;
  autoRenew: boolean;
  usage: {
    articlesRead: number;
    translationsUsed: number;
    apiCallsMade: number;
    lastReset: string;
  };
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  enabled: boolean;
}

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  tier: SubscriptionTier;
  limits: {
    requestsPerMinute: number;
    requestsPerMonth: number;
  };
  usage: {
    requestsThisMonth: number;
    lastReset: string;
  };
  permissions: string[];
  status: 'active' | 'suspended' | 'expired';
}

export class PremiumSystem {
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
  private userSubscriptions: Map<string, UserSubscription> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private premiumFeatures: Map<string, PremiumFeature> = new Map();

  constructor() {
    this.initializeSubscriptionPlans();
    this.initializePremiumFeatures();
    this.loadUserData();
  }

  private initializeSubscriptionPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: 'Gratuit',
        tier: 'free',
        price: { monthly: 0, yearly: 0, currency: 'EUR' },
        features: [
          'Accès aux actualités de base',
          'Traductions limitées (10/jour)',
          'Bookmarks (max 50)',
          'Catégories principales',
          'Support communautaire'
        ],
        limits: {
          articlesPerDay: 100,
          translationsPerDay: 10,
          bookmarksMax: 50,
          categoriesMax: 8,
          exportFormats: [],
          apiCallsPerMonth: 0
        },
        badge: { text: 'Gratuit', color: 'gray', icon: '🆓' }
      },
      {
        id: 'premium',
        name: 'Premium',
        tier: 'premium',
        price: { monthly: 9.99, yearly: 99.99, currency: 'EUR' },
        features: [
          'Accès illimité aux actualités',
          'Traductions illimitées',
          'Bookmarks illimités',
          'Toutes les catégories',
          'Mode sombre avancé',
          'Notifications push personnalisées',
          'Recherche avancée',
          'Export PDF',
          'Historique étendu',
          'Support prioritaire'
        ],
        limits: {
          articlesPerDay: -1, // illimité
          translationsPerDay: -1,
          bookmarksMax: -1,
          categoriesMax: -1,
          exportFormats: ['pdf', 'epub'],
          apiCallsPerMonth: 1000
        },
        badge: { text: 'Premium', color: 'blue', icon: '⭐' }
      },
      {
        id: 'pro',
        name: 'Professionnel',
        tier: 'pro',
        price: { monthly: 29.99, yearly: 299.99, currency: 'EUR' },
        features: [
          'Toutes les fonctionnalités Premium',
          'API accès complet',
          'Analytiques avancées',
          'Intégrations tierces',
          'Alertes en temps réel',
          'Rapports personnalisés',
          'Multi-comptes (5 utilisateurs)',
          'Stockage cloud',
          'Sauvegarde automatique',
          'Support dédié'
        ],
        limits: {
          articlesPerDay: -1,
          translationsPerDay: -1,
          bookmarksMax: -1,
          categoriesMax: -1,
          exportFormats: ['pdf', 'epub', 'json', 'csv'],
          apiCallsPerMonth: 10000
        },
        badge: { text: 'Pro', color: 'purple', icon: '🚀' }
      },
      {
        id: 'enterprise',
        name: 'Entreprise',
        tier: 'enterprise',
        price: { monthly: 99.99, yearly: 999.99, currency: 'EUR' },
        features: [
          'Toutes les fonctionnalités Pro',
          'API illimitée',
          'White-label solution',
          'Intégration personnalisée',
          'SLA garanti (99.9%)',
          'Support 24/7',
          'Formation équipe',
          'Utilisateurs illimités',
          'Infrastructure dédiée',
          'Conformité RGPD++'
        ],
        limits: {
          articlesPerDay: -1,
          translationsPerDay: -1,
          bookmarksMax: -1,
          categoriesMax: -1,
          exportFormats: ['pdf', 'epub', 'json', 'csv', 'xml'],
          apiCallsPerMonth: -1
        },
        badge: { text: 'Enterprise', color: 'gold', icon: '👑' }
      }
    ];

    plans.forEach(plan => {
      this.subscriptionPlans.set(plan.id, plan);
    });
  }

  private initializePremiumFeatures() {
    const features: PremiumFeature[] = [
      {
        id: 'unlimited_translations',
        name: 'Traductions illimitées',
        description: 'Traduisez autant d\'articles que vous voulez dans toutes les langues',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'advanced_search',
        name: 'Recherche avancée',
        description: 'Filtres avancés par date, auteur, sentiment, géolocalisation',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'dark_mode_plus',
        name: 'Mode sombre avancé',
        description: 'Thèmes personnalisés et mode OLED',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'push_notifications',
        name: 'Notifications push personnalisées',
        description: 'Alertes personnalisées selon vos centres d\'intérêt',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'export_pdf',
        name: 'Export PDF',
        description: 'Exportez vos articles favoris au format PDF',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'api_access',
        name: 'Accès API',
        description: 'Intégrez SuperFacts dans vos applications',
        requiredTier: 'premium',
        enabled: true
      },
      {
        id: 'advanced_analytics',
        name: 'Analytiques avancées',
        description: 'Statistiques détaillées de votre usage',
        requiredTier: 'pro',
        enabled: true
      },
      {
        id: 'real_time_alerts',
        name: 'Alertes temps réel',
        description: 'Notifications instantanées pour les sujets importants',
        requiredTier: 'pro',
        enabled: true
      },
      {
        id: 'custom_reports',
        name: 'Rapports personnalisés',
        description: 'Générez des rapports sur mesure',
        requiredTier: 'pro',
        enabled: true
      },
      {
        id: 'white_label',
        name: 'Solution white-label',
        description: 'Personnalisez complètement l\'interface',
        requiredTier: 'enterprise',
        enabled: true
      }
    ];

    features.forEach(feature => {
      this.premiumFeatures.set(feature.id, feature);
    });
  }

  // Gestion des abonnements
  public getSubscriptionPlans(): SubscriptionPlan[] {
    return Array.from(this.subscriptionPlans.values());
  }

  public getPlan(planId: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.get(planId);
  }

  public getUserSubscription(userId: string): UserSubscription | null {
    return this.userSubscriptions.get(userId) || null;
  }

  public getUserTier(userId: string): SubscriptionTier {
    const subscription = this.getUserSubscription(userId);
    return subscription?.status === 'active' ? subscription.tier : 'free';
  }

  public hasAccess(userId: string, feature: string): boolean {
    const userTier = this.getUserTier(userId);
    const premiumFeature = this.premiumFeatures.get(feature);
    
    if (!premiumFeature || !premiumFeature.enabled) {
      return false;
    }

    // Hiérarchie des tiers
    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      premium: 1,
      pro: 2,
      enterprise: 3
    };

    return tierHierarchy[userTier] >= tierHierarchy[premiumFeature.requiredTier];
  }

  public canPerformAction(
    userId: string, 
    action: 'read_article' | 'translate' | 'bookmark' | 'api_call',
    currentUsage?: number
  ): { allowed: boolean; reason?: string; upgradeRequired?: SubscriptionTier } {
    const subscription = this.getUserSubscription(userId);
    const plan = subscription ? this.getPlan(subscription.planId) : this.getPlan('free');
    
    if (!plan) {
      return { allowed: false, reason: 'Plan non trouvé' };
    }

    // Vérifier l'état de l'abonnement
    if (subscription && subscription.status !== 'active') {
      return { 
        allowed: false, 
        reason: 'Abonnement expiré ou suspendu',
        upgradeRequired: 'premium'
      };
    }

    // Vérifier les limites selon l'action
    switch (action) {
      case 'translate':
        if (plan.limits.translationsPerDay === -1) return { allowed: true };
        if ((currentUsage || 0) >= plan.limits.translationsPerDay) {
          return {
            allowed: false,
            reason: `Limite de ${plan.limits.translationsPerDay} traductions/jour atteinte`,
            upgradeRequired: 'premium'
          };
        }
        break;

      case 'bookmark':
        if (plan.limits.bookmarksMax === -1) return { allowed: true };
        if ((currentUsage || 0) >= plan.limits.bookmarksMax) {
          return {
            allowed: false,
            reason: `Limite de ${plan.limits.bookmarksMax} bookmarks atteinte`,
            upgradeRequired: 'premium'
          };
        }
        break;

      case 'api_call':
        if (plan.limits.apiCallsPerMonth === -1) return { allowed: true };
        if (plan.limits.apiCallsPerMonth === 0) {
          return {
            allowed: false,
            reason: 'Accès API non inclus dans votre plan',
            upgradeRequired: 'premium'
          };
        }
        if ((currentUsage || 0) >= plan.limits.apiCallsPerMonth) {
          return {
            allowed: false,
            reason: `Limite de ${plan.limits.apiCallsPerMonth} appels API/mois atteinte`,
            upgradeRequired: plan.tier === 'premium' ? 'pro' : 'premium'
          };
        }
        break;

      case 'read_article':
        if (plan.limits.articlesPerDay === -1) return { allowed: true };
        if ((currentUsage || 0) >= plan.limits.articlesPerDay) {
          return {
            allowed: false,
            reason: `Limite de ${plan.limits.articlesPerDay} articles/jour atteinte`,
            upgradeRequired: 'premium'
          };
        }
        break;
    }

    return { allowed: true };
  }

  // Gestion des API keys
  public generateAPIKey(userId: string, name: string): APIKey | null {
    const tier = this.getUserTier(userId);
    
    if (tier === 'free') {
      return null; // Pas d'API key pour les utilisateurs gratuits
    }

    const plan = this.subscriptionPlans.get(tier)!;
    const apiKey: APIKey = {
      id: this.generateUniqueId(),
      userId,
      name,
      key: this.generateSecureKey(),
      createdAt: new Date().toISOString(),
      tier,
      limits: {
        requestsPerMinute: this.getAPIRateLimit(tier),
        requestsPerMonth: plan.limits.apiCallsPerMonth
      },
      usage: {
        requestsThisMonth: 0,
        lastReset: new Date().toISOString()
      },
      permissions: this.getAPIPermissions(tier),
      status: 'active'
    };

    this.apiKeys.set(apiKey.id, apiKey);
    this.saveAPIKeys();
    
    return apiKey;
  }

  public validateAPIKey(keyString: string): { valid: boolean; key?: APIKey; error?: string } {
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.key === keyString) {
        if (apiKey.status !== 'active') {
          return { valid: false, error: 'API key inactive' };
        }

        // Vérifier les limites de taux
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (new Date(apiKey.usage.lastReset) < monthStart) {
          // Réinitialiser les compteurs du mois
          apiKey.usage.requestsThisMonth = 0;
          apiKey.usage.lastReset = monthStart.toISOString();
        }

        if (apiKey.limits.requestsPerMonth !== -1 && 
            apiKey.usage.requestsThisMonth >= apiKey.limits.requestsPerMonth) {
          return { valid: false, error: 'Monthly quota exceeded' };
        }

        // Incrémenter l'usage
        apiKey.usage.requestsThisMonth++;
        apiKey.lastUsed = new Date().toISOString();
        this.saveAPIKeys();

        return { valid: true, key: apiKey };
      }
    }

    return { valid: false, error: 'Invalid API key' };
  }

  public getUserAPIKeys(userId: string): APIKey[] {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  public revokeAPIKey(keyId: string, userId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey && apiKey.userId === userId) {
      apiKey.status = 'suspended';
      this.saveAPIKeys();
      return true;
    }
    return false;
  }

  // Export premium features
  public exportArticleToPDF(article: Article, userId: string): { success: boolean; data?: string; error?: string } {
    if (!this.hasAccess(userId, 'export_pdf')) {
      return { 
        success: false, 
        error: 'Export PDF nécessite un abonnement Premium ou supérieur' 
      };
    }

    try {
      // Ici on intégrerait une vraie librairie PDF comme jsPDF
      const pdfContent = this.generateSimplePDF(article);
      
      analytics.trackInteraction('click', 'export_pdf', article.id, {
        tier: this.getUserTier(userId),
        premium: true
      }, userId);

      return { success: true, data: pdfContent };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la génération du PDF' };
    }
  }

  public exportUserData(userId: string, format: 'json' | 'csv'): { success: boolean; data?: string; error?: string } {
    const tier = this.getUserTier(userId);
    const plan = this.subscriptionPlans.get(tier)!;
    
    if (!plan.limits.exportFormats.includes(format)) {
      return {
        success: false,
        error: `Export ${format.toUpperCase()} nécessite un abonnement supérieur`
      };
    }

    try {
      // Collecter les données utilisateur
      const userData = this.collectUserDataForExport(userId);
      
      let exportData: string;
      if (format === 'json') {
        exportData = JSON.stringify(userData, null, 2);
      } else {
        exportData = this.convertToCSV(userData);
      }

      return { success: true, data: exportData };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export des données' };
    }
  }

  // Notifications premium
  public setupCustomNotifications(
    userId: string, 
    settings: {
      keywords: string[];
      categories: string[];
      sources: string[];
      frequency: 'instant' | 'hourly' | 'daily';
    }
  ): boolean {
    if (!this.hasAccess(userId, 'push_notifications')) {
      return false;
    }

    // Sauvegarder les paramètres de notification
    localStorage.setItem(`notifications_${userId}`, JSON.stringify({
      ...settings,
      updatedAt: new Date().toISOString()
    }));

    return true;
  }

  // Upgrade suggestions
  public getUpgradeSuggestions(userId: string): {
    currentTier: SubscriptionTier;
    suggestedTier?: SubscriptionTier;
    reasons: string[];
    savings?: number;
  } {
    const currentTier = this.getUserTier(userId);
    const subscription = this.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        currentTier,
        suggestedTier: 'premium',
        reasons: [
          'Traductions illimitées',
          'Recherche avancée',
          'Export PDF',
          'Support prioritaire'
        ]
      };
    }

    // Analyser l'usage pour suggérer un upgrade
    const usage = subscription.usage;
    const plan = this.getPlan(subscription.planId)!;
    const reasons: string[] = [];

    // Si proche des limites
    if (plan.limits.translationsPerDay > 0 && 
        usage.translationsUsed > plan.limits.translationsPerDay * 0.8) {
      reasons.push('Vous approchez de votre limite de traductions');
    }

    if (plan.limits.apiCallsPerMonth > 0 && 
        usage.apiCallsMade > plan.limits.apiCallsPerMonth * 0.8) {
      reasons.push('Vous approchez de votre limite d\'API');
    }

    // Calculer les économies annuelles
    let savings = 0;
    if (currentTier === 'premium') {
      const premiumPlan = this.getPlan('premium')!;
      savings = (premiumPlan.price.monthly * 12) - premiumPlan.price.yearly;
    }

    return {
      currentTier,
      suggestedTier: currentTier === 'free' ? 'premium' : 
                     currentTier === 'premium' ? 'pro' : undefined,
      reasons,
      savings: savings > 0 ? savings : undefined
    };
  }

  // Utilitaires privées
  private generateUniqueId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sf_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getAPIRateLimit(tier: SubscriptionTier): number {
    const limits: Record<SubscriptionTier, number> = {
      free: 0,
      premium: 60,
      pro: 300,
      enterprise: -1
    };
    return limits[tier];
  }

  private getAPIPermissions(tier: SubscriptionTier): string[] {
    const basePermissions = ['news:read', 'translate:basic'];
    
    if (tier === 'premium') {
      return [...basePermissions, 'search:advanced', 'export:pdf'];
    }
    
    if (tier === 'pro') {
      return [...basePermissions, 'search:advanced', 'export:pdf', 'analytics:read', 'alerts:manage'];
    }
    
    if (tier === 'enterprise') {
      return [...basePermissions, 'search:advanced', 'export:all', 'analytics:full', 'alerts:manage', 'admin:read'];
    }
    
    return basePermissions;
  }

  private generateSimplePDF(article: Article): string {
    // Version simplifiée - en production utiliser jsPDF
    const pdfContent = `
=== SuperFacts.fr ===

${article.title}

Auteur: ${article.author}
Source: ${article.source}
Date: ${new Date(article.publishDate).toLocaleDateString()}
Catégorie: ${article.category}

${article.summary}

${article.content}

---
Généré par SuperFacts.fr Premium
${new Date().toLocaleString()}
    `;
    
    return btoa(pdfContent); // Base64 encode
  }

  private collectUserDataForExport(userId: string): any {
    // Collecter toutes les données utilisateur
    return {
      userId,
      subscription: this.getUserSubscription(userId),
      exportDate: new Date().toISOString(),
      // Ici on ajouterait plus de données selon les besoins
    };
  }

  private convertToCSV(data: any): string {
    // Conversion simple en CSV
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    ).join(',');
    
    return `${headers}\n${values}`;
  }

  // Persistance
  private saveUserData() {
    try {
      const subscriptionsData = Array.from(this.userSubscriptions.entries());
      localStorage.setItem('premium_subscriptions', JSON.stringify(subscriptionsData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des abonnements:', error);
    }
  }

  private loadUserData() {
    try {
      const stored = localStorage.getItem('premium_subscriptions');
      if (stored) {
        const subscriptionsData = JSON.parse(stored);
        subscriptionsData.forEach(([userId, subscription]: [string, UserSubscription]) => {
          this.userSubscriptions.set(userId, subscription);
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements:', error);
    }
  }

  private saveAPIKeys() {
    try {
      const apiKeysData = Array.from(this.apiKeys.entries());
      localStorage.setItem('api_keys', JSON.stringify(apiKeysData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des API keys:', error);
    }
  }

  // API publique pour les tests/démo
  public simulateSubscription(userId: string, planId: string): boolean {
    const plan = this.getPlan(planId);
    if (!plan) return false;

    const subscription: UserSubscription = {
      userId,
      planId,
      tier: plan.tier,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      status: 'active',
      autoRenew: true,
      usage: {
        articlesRead: 0,
        translationsUsed: 0,
        apiCallsMade: 0,
        lastReset: new Date().toISOString()
      }
    };

    this.userSubscriptions.set(userId, subscription);
    this.saveUserData();
    return true;
  }
}

// Instance singleton
export const premiumSystem = new PremiumSystem();
