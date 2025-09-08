// Ad-related TypeScript interfaces

export interface Ad {
  id: string;
  title: string;
  placement: string;
  status: 'active' | 'paused' | 'inactive';
  advertiser: {
    name: string;
    id: string;
  };
  campaign: {
    id: string;
    name: string;
    budget: number;
    spentAmount: number;
  };
  pricing: {
    model: 'cpm' | 'cpc' | 'cpa';
    amount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceData {
  adId: string;
  date: Date;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
}

export interface SummaryAnalytics {
  overview: {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
    activeCampaigns: number;
    totalBudget: number;
    spentBudget: number;
    remainingBudget: number;
  };
  topPerformingAds: TopPerformingAd[];
  revenueByDay: RevenueByDay[];
  performanceMetrics: {
    impressionGrowth: number;
    clickGrowth: number;
    revenueGrowth: number;
  };
}

export interface TopPerformingAd {
  adId: string;
  title: string;
  advertiser: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
}

export interface DetailedAnalytics {
  performanceByAd: (PerformanceData & {
    adTitle: string;
    advertiser: string;
    placement: string;
    pricing: Record<string, unknown>;
  })[];
  performanceByPlacement: Record<string, unknown>[];
  performanceByAdvertiser: Record<string, unknown>[];
  hourlyPerformance: Record<string, unknown>[];
  devicePerformance: Record<string, unknown>[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByModel: Record<string, unknown>;
  topEarningAds: {
    adId: string;
    title: string;
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  revenueByDay: RevenueByDay[];
  projectedRevenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  revenueShare: {
    advertiser: string;
    revenue: number;
    percentage: number;
  }[];
}
