import { 
  Advertisement, 
  AdRequest, 
  AdResponse, 
  AdPlacement, 
  AdStatus, 
  AdPerformance,
  NativeAd,
  VideoAd,
  AdType 
} from '@/types/advertising';
import fs from 'fs/promises';
import path from 'path';

export class AdManager {
  private ads: Advertisement[] = [];
  private performance: AdPerformance[] = [];
  private adFilePath = path.join(process.cwd(), 'data/ads.json');
  private performanceFilePath = path.join(process.cwd(), 'data/ad-performance.json');

  private initialized = false;

  constructor() {
    // Initialization is async, so we defer it
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.loadAds();
    await this.loadPerformance();
    this.initialized = true;
  }

  private async loadAds(): Promise<void> {
    try {
      const data = await fs.readFile(this.adFilePath, 'utf-8');
      const adsData = JSON.parse(data);
      this.ads = adsData.map((ad: any) => ({
        ...ad,
        createdAt: new Date(ad.createdAt),
        updatedAt: new Date(ad.updatedAt),
        startDate: new Date(ad.startDate),
        endDate: new Date(ad.endDate)
      }));
    } catch (error) {
      console.log('No ads file found, starting with empty ads array');
      this.ads = [];
    }
  }

  private async loadPerformance(): Promise<void> {
    try {
      const data = await fs.readFile(this.performanceFilePath, 'utf-8');
      const performanceData = JSON.parse(data);
      this.performance = performanceData.map((perf: any) => ({
        ...perf,
        date: new Date(perf.date)
      }));
    } catch (error) {
      console.log('No performance file found, starting with empty performance array');
      this.performance = [];
    }
  }

  private async saveAds(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.adFilePath), { recursive: true });
      await fs.writeFile(this.adFilePath, JSON.stringify(this.ads, null, 2));
    } catch (error) {
      console.error('Error saving ads:', error);
    }
  }

  private async savePerformance(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.performanceFilePath), { recursive: true });
      await fs.writeFile(this.performanceFilePath, JSON.stringify(this.performance, null, 2));
    } catch (error) {
      console.error('Error saving performance:', error);
    }
  }

  // Get ad for a specific request
  async getAd(request: AdRequest): Promise<AdResponse | null> {
    await this.initialize();
    
    const eligibleAds = this.getEligibleAds(request);
    
    if (eligibleAds.length === 0) {
      return null;
    }

    // Weighted selection based on pricing and performance
    const selectedAd = this.selectAdByWeight(eligibleAds);
    
    // Track impression
    await this.trackImpression(selectedAd.id);

    return {
      ad: selectedAd,
      tracking: {
        impressionUrl: `/api/ads/track/impression/${selectedAd.id}`,
        clickUrl: `/api/ads/track/click/${selectedAd.id}`
      },
      refreshAfter: selectedAd.placement === AdPlacement.SIDEBAR ? 30 : undefined
    };
  }

  private getEligibleAds(request: AdRequest): Advertisement[] {
    const now = new Date();
    
    return this.ads.filter(ad => {
      // Check if ad is active and within date range
      if (ad.status !== AdStatus.ACTIVE || ad.startDate > now || ad.endDate < now) {
        return false;
      }

      // Check placement match
      if (ad.placement !== request.placement) {
        return false;
      }

      // Check device targeting
      if (!ad.targeting.devices.includes(request.userContext.device)) {
        return false;
      }

      // Check language targeting
      if (!ad.targeting.languages.includes(request.userContext.language)) {
        return false;
      }

      // Check category targeting
      if (ad.targeting.categories.length > 0) {
        const hasMatchingCategory = ad.targeting.categories.some(category => 
          request.userContext.categories.includes(category)
        );
        if (!hasMatchingCategory) {
          return false;
        }
      }

      // Check time targeting
      if (ad.targeting.timeOfDay) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const [startHour, startMin] = ad.targeting.timeOfDay.start.split(':').map(Number);
        const [endHour, endMin] = ad.targeting.timeOfDay.end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (currentTime < startTime || currentTime > endTime) {
          return false;
        }
      }

      // Check day of week targeting
      if (ad.targeting.daysOfWeek && ad.targeting.daysOfWeek.length > 0) {
        const currentDay = now.getDay();
        if (!ad.targeting.daysOfWeek.includes(currentDay)) {
          return false;
        }
      }

      // Check budget constraints
      if (ad.campaign.spentAmount >= ad.campaign.budget) {
        return false;
      }

      return true;
    });
  }

  private selectAdByWeight(ads: Advertisement[]): Advertisement {
    // Weight ads based on pricing (higher paying ads get priority)
    const weights = ads.map(ad => {
      const baseWeight = ad.pricing.rate;
      const performanceMultiplier = this.getPerformanceMultiplier(ad.id);
      return baseWeight * performanceMultiplier;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < ads.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return ads[i];
      }
    }

    return ads[0]; // Fallback
  }

  private getPerformanceMultiplier(adId: string): number {
    const adPerformance = this.performance.filter(p => p.adId === adId);
    if (adPerformance.length === 0) return 1;

    const avgCTR = adPerformance.reduce((sum, p) => sum + p.ctr, 0) / adPerformance.length;
    
    // Boost ads with better performance (CTR > 2% gets boost)
    return avgCTR > 0.02 ? 1.5 : avgCTR > 0.01 ? 1.2 : 1;
  }

  // Track impression
  async trackImpression(adId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayPerformance = this.performance.find(p => 
      p.adId === adId && p.date.getTime() === today.getTime()
    );

    if (!todayPerformance) {
      todayPerformance = {
        adId,
        date: today,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpm: 0,
        cpc: 0
      };
      this.performance.push(todayPerformance);
    }

    todayPerformance.impressions++;
    
    // Update campaign impressions
    const ad = this.ads.find(a => a.id === adId);
    if (ad) {
      ad.campaign.impressions++;
      this.updateRevenue(ad, 'impression');
    }

    await this.savePerformance();
    await this.saveAds();
  }

  // Track click
  async trackClick(adId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayPerformance = this.performance.find(p => 
      p.adId === adId && p.date.getTime() === today.getTime()
    );

    if (todayPerformance) {
      todayPerformance.clicks++;
      todayPerformance.ctr = todayPerformance.clicks / todayPerformance.impressions;
    }

    // Update campaign clicks
    const ad = this.ads.find(a => a.id === adId);
    if (ad) {
      ad.campaign.clicks++;
      this.updateRevenue(ad, 'click');
    }

    await this.savePerformance();
    await this.saveAds();
  }

  private updateRevenue(ad: Advertisement, action: 'impression' | 'click'): void {
    let revenue = 0;
    
    switch (ad.pricing.model) {
      case 'cpm':
        if (action === 'impression') {
          revenue = ad.pricing.rate / 1000;
        }
        break;
      case 'cpc':
        if (action === 'click') {
          revenue = ad.pricing.rate;
        }
        break;
      case 'fixed':
        // Fixed pricing is handled differently (monthly/campaign basis)
        break;
    }

    if (revenue > 0) {
      ad.campaign.spentAmount += revenue;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPerformance = this.performance.find(p => 
        p.adId === ad.id && p.date.getTime() === today.getTime()
      );
      
      if (todayPerformance) {
        todayPerformance.revenue += revenue;
      }
    }
  }

  // Add new advertisement
  async addAd(ad: Advertisement): Promise<void> {
    this.ads.push(ad);
    await this.saveAds();
  }

  // Update advertisement
  async updateAd(adId: string, updates: Partial<Advertisement>): Promise<boolean> {
    const index = this.ads.findIndex(a => a.id === adId);
    if (index === -1) return false;

    this.ads[index] = { ...this.ads[index], ...updates, updatedAt: new Date() };
    await this.saveAds();
    return true;
  }

  // Delete advertisement
  async deleteAd(adId: string): Promise<boolean> {
    const index = this.ads.findIndex(a => a.id === adId);
    if (index === -1) return false;

    this.ads.splice(index, 1);
    await this.saveAds();
    return true;
  }

  // Get all ads for management
  async getAds(): Promise<Advertisement[]> {
    await this.initialize();
    return this.ads;
  }

  // Get performance data
  getPerformance(adId?: string, startDate?: Date, endDate?: Date): AdPerformance[] {
    let filtered = this.performance;

    if (adId) {
      filtered = filtered.filter(p => p.adId === adId);
    }

    if (startDate) {
      filtered = filtered.filter(p => p.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(p => p.date <= endDate);
    }

    return filtered;
  }

  // Create sample ads for testing
  async createSampleAds(): Promise<void> {
    await this.initialize();
    const sampleAds: Advertisement[] = [
      {
        id: 'sample-banner-1',
        type: AdType.BANNER,
        title: 'Découvrez notre nouvelle offre',
        content: 'Profitez de 30% de réduction sur tous nos produits tech',
        imageUrl: 'https://via.placeholder.com/728x90/4F46E5/white?text=Banner+Ad',
        targetUrl: 'https://example.com/promo',
        advertiser: {
          id: 'advertiser-1',
          name: 'Tech Store',
          email: 'contact@techstore.com',
          company: 'Tech Store SARL',
          website: 'https://techstore.com',
          contactInfo: {
            phone: '+33 1 23 45 67 89',
            address: '123 Rue de la Tech',
            city: 'Paris',
            country: 'France',
            postalCode: '75001'
          },
          billingInfo: {
            paymentMethod: 'credit_card',
            billingCycle: 'monthly',
            currency: 'EUR'
          },
          createdAt: new Date(),
          isVerified: true
        },
        campaign: {
          id: 'campaign-1',
          name: 'Promotion Printemps 2024',
          description: 'Campagne de promotion pour le printemps',
          budget: 5000,
          dailyBudget: 100,
          spentAmount: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: AdStatus.ACTIVE
        },
        targeting: {
          categories: ['tech', 'économie'],
          languages: ['fr'],
          countries: ['FR'],
          devices: ['mobile', 'desktop', 'tablet'],
          keywords: ['tech', 'innovation', 'numérique']
        },
        placement: AdPlacement.HEADER,
        pricing: {
          model: 'cpm',
          rate: 2.5,
          currency: 'EUR',
          minBudget: 100
        },
        status: AdStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-sidebar-1',
        type: AdType.BANNER,
        title: 'Formation en ligne',
        content: 'Apprenez le développement web en 3 mois. Inscription ouverte !',
        imageUrl: 'https://via.placeholder.com/300x250/10B981/white?text=Sidebar+Ad',
        targetUrl: 'https://example.com/formation',
        advertiser: {
          id: 'advertiser-2',
          name: 'CodeAcademy FR',
          email: 'contact@codeacademy-fr.com',
          company: 'CodeAcademy France',
          website: 'https://codeacademy-fr.com',
          contactInfo: {
            phone: '+33 1 98 76 54 32',
            address: '456 Avenue de l\'Innovation',
            city: 'Lyon',
            country: 'France',
            postalCode: '69000'
          },
          billingInfo: {
            paymentMethod: 'bank_transfer',
            billingCycle: 'monthly',
            currency: 'EUR'
          },
          createdAt: new Date(),
          isVerified: true
        },
        campaign: {
          id: 'campaign-2',
          name: 'Campagne Formation 2024',
          description: 'Promouvoir nos formations en développement',
          budget: 3000,
          dailyBudget: 75,
          spentAmount: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          status: AdStatus.ACTIVE
        },
        targeting: {
          categories: ['tech', 'économie', 'éducation'],
          languages: ['fr'],
          countries: ['FR'],
          devices: ['desktop', 'tablet'],
          keywords: ['formation', 'développement', 'programmation', 'carrière']
        },
        placement: AdPlacement.SIDEBAR,
        pricing: {
          model: 'cpc',
          rate: 1.25,
          currency: 'EUR',
          minBudget: 150
        },
        status: AdStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-mobile-sticky-1',
        type: AdType.BANNER,
        title: 'App Mobile',
        content: 'Téléchargez notre app !',
        imageUrl: 'https://via.placeholder.com/320x50/F59E0B/white?text=Mobile+Ad',
        targetUrl: 'https://example.com/app',
        advertiser: {
          id: 'advertiser-3',
          name: 'AppStore FR',
          email: 'promo@appstore-fr.com',
          company: 'AppStore France',
          website: 'https://appstore-fr.com',
          contactInfo: {
            phone: '+33 1 11 22 33 44',
            address: '789 Rue du Mobile',
            city: 'Marseille',
            country: 'France',
            postalCode: '13000'
          },
          billingInfo: {
            paymentMethod: 'credit_card',
            billingCycle: 'monthly',
            currency: 'EUR'
          },
          createdAt: new Date(),
          isVerified: true
        },
        campaign: {
          id: 'campaign-3',
          name: 'App Mobile Promo',
          description: 'Promotion de notre application mobile',
          budget: 2000,
          dailyBudget: 50,
          spentAmount: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          status: AdStatus.ACTIVE
        },
        targeting: {
          categories: ['tech', 'actualité'],
          languages: ['fr'],
          countries: ['FR'],
          devices: ['mobile'],
          keywords: ['mobile', 'app', 'téléchargement']
        },
        placement: AdPlacement.MOBILE_STICKY,
        pricing: {
          model: 'cpm',
          rate: 1.8,
          currency: 'EUR',
          minBudget: 80
        },
        status: AdStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const ad of sampleAds) {
      await this.addAd(ad);
    }
  }
}

// Singleton instance
export const adManager = new AdManager();
