import { NextRequest, NextResponse } from 'next/server';
import { adManager } from '@/lib/ad-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const type = searchParams.get('type') || 'summary'; // summary, detailed, revenue

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
    }

    // Get performance data
    const performanceData = adManager.getPerformance(adId, startDate, endDate);
    
    // Get ads data for context
    const ads = adManager.getAds();
    const relevantAds = adId ? ads.filter(a => a.id === adId) : ads;

    switch (type) {
      case 'summary':
        return NextResponse.json({
          success: true,
          data: generateSummaryAnalytics(performanceData, relevantAds)
        });

      case 'detailed':
        return NextResponse.json({
          success: true,
          data: generateDetailedAnalytics(performanceData, relevantAds)
        });

      case 'revenue':
        return NextResponse.json({
          success: true,
          data: generateRevenueAnalytics(performanceData, relevantAds)
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

function generateSummaryAnalytics(performanceData: any[], ads: any[]) {
  const totalImpressions = performanceData.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = performanceData.reduce((sum, p) => sum + p.clicks, 0);
  const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Active campaigns
  const activeCampaigns = ads.filter(ad => ad.status === 'active').length;
  const totalBudget = ads.reduce((sum, ad) => sum + ad.campaign.budget, 0);
  const spentBudget = ads.reduce((sum, ad) => sum + ad.campaign.spentAmount, 0);

  return {
    overview: {
      totalImpressions,
      totalClicks,
      totalRevenue,
      averageCTR: Number(avgCTR.toFixed(2)),
      activeCampaigns,
      totalBudget,
      spentBudget,
      remainingBudget: totalBudget - spentBudget
    },
    topPerformingAds: getTopPerformingAds(performanceData, ads),
    revenueByDay: getRevenueByDay(performanceData),
    performanceMetrics: {
      impressionGrowth: calculateGrowth(performanceData, 'impressions'),
      clickGrowth: calculateGrowth(performanceData, 'clicks'),
      revenueGrowth: calculateGrowth(performanceData, 'revenue')
    }
  };
}

function generateDetailedAnalytics(performanceData: any[], ads: any[]) {
  return {
    performanceByAd: performanceData.map(p => {
      const ad = ads.find(a => a.id === p.adId);
      return {
        ...p,
        adTitle: ad?.title || 'Unknown Ad',
        advertiser: ad?.advertiser.name || 'Unknown Advertiser',
        placement: ad?.placement || 'Unknown Placement',
        pricing: ad?.pricing || {}
      };
    }),
    performanceByPlacement: getPerformanceByPlacement(performanceData, ads),
    performanceByAdvertiser: getPerformanceByAdvertiser(performanceData, ads),
    hourlyPerformance: getHourlyPerformance(performanceData),
    devicePerformance: getDevicePerformance(ads)
  };
}

function generateRevenueAnalytics(performanceData: any[], ads: any[]) {
  const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
  const revenueByModel = getRevenueByPricingModel(ads);
  const topEarningAds = performanceData
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => {
      const ad = ads.find(a => a.id === p.adId);
      return {
        adId: p.adId,
        title: ad?.title || 'Unknown Ad',
        revenue: p.revenue,
        impressions: p.impressions,
        clicks: p.clicks,
        ctr: p.ctr
      };
    });

  return {
    totalRevenue,
    revenueByModel,
    topEarningAds,
    revenueByDay: getRevenueByDay(performanceData),
    projectedRevenue: calculateProjectedRevenue(performanceData, ads),
    revenueShare: getRevenueShare(performanceData, ads)
  };
}

function getTopPerformingAds(performanceData: any[], ads: any[], limit = 5) {
  const adPerformance = new Map();
  
  performanceData.forEach(p => {
    if (!adPerformance.has(p.adId)) {
      adPerformance.set(p.adId, {
        adId: p.adId,
        impressions: 0,
        clicks: 0,
        revenue: 0
      });
    }
    
    const perf = adPerformance.get(p.adId);
    perf.impressions += p.impressions;
    perf.clicks += p.clicks;
    perf.revenue += p.revenue;
    perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
  });

  return Array.from(adPerformance.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map(p => {
      const ad = ads.find(a => a.id === p.adId);
      return {
        ...p,
        title: ad?.title || 'Unknown Ad',
        advertiser: ad?.advertiser.name || 'Unknown Advertiser'
      };
    });
}

function getRevenueByDay(performanceData: any[]) {
  const revenueByDay = new Map();
  
  performanceData.forEach(p => {
    const day = p.date.toISOString().split('T')[0];
    if (!revenueByDay.has(day)) {
      revenueByDay.set(day, 0);
    }
    revenueByDay.set(day, revenueByDay.get(day) + p.revenue);
  });

  return Array.from(revenueByDay.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateGrowth(performanceData: any[], metric: string) {
  if (performanceData.length < 2) return 0;
  
  const sortedData = performanceData.sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
  
  const firstHalfSum = firstHalf.reduce((sum, p) => sum + p[metric], 0);
  const secondHalfSum = secondHalf.reduce((sum, p) => sum + p[metric], 0);
  
  return firstHalfSum > 0 ? ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100 : 0;
}

function getPerformanceByPlacement(performanceData: any[], ads: any[]) {
  const placementPerf = new Map();
  
  performanceData.forEach(p => {
    const ad = ads.find(a => a.id === p.adId);
    const placement = ad?.placement || 'unknown';
    
    if (!placementPerf.has(placement)) {
      placementPerf.set(placement, {
        placement,
        impressions: 0,
        clicks: 0,
        revenue: 0
      });
    }
    
    const perf = placementPerf.get(placement);
    perf.impressions += p.impressions;
    perf.clicks += p.clicks;
    perf.revenue += p.revenue;
    perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
  });

  return Array.from(placementPerf.values());
}

function getPerformanceByAdvertiser(performanceData: any[], ads: any[]) {
  const advertiserPerf = new Map();
  
  performanceData.forEach(p => {
    const ad = ads.find(a => a.id === p.adId);
    const advertiser = ad?.advertiser.name || 'Unknown';
    
    if (!advertiserPerf.has(advertiser)) {
      advertiserPerf.set(advertiser, {
        advertiser,
        impressions: 0,
        clicks: 0,
        revenue: 0
      });
    }
    
    const perf = advertiserPerf.get(advertiser);
    perf.impressions += p.impressions;
    perf.clicks += p.clicks;
    perf.revenue += p.revenue;
    perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
  });

  return Array.from(advertiserPerf.values());
}

function getHourlyPerformance(performanceData: any[]) {
  // This would require more detailed timestamp data
  // For now, return empty array or mock data
  return [];
}

function getDevicePerformance(ads: any[]) {
  // This would require device tracking in performance data
  // For now, return targeting preferences
  const deviceTargeting = { mobile: 0, desktop: 0, tablet: 0 };
  
  ads.forEach(ad => {
    ad.targeting.devices.forEach((device: string) => {
      if (device in deviceTargeting) {
        deviceTargeting[device as keyof typeof deviceTargeting]++;
      }
    });
  });

  return deviceTargeting;
}

function getRevenueByPricingModel(ads: any[]) {
  const revenueByModel = { cpm: 0, cpc: 0, cpa: 0, fixed: 0 };
  
  ads.forEach(ad => {
    const model = ad.pricing.model;
    if (model in revenueByModel) {
      revenueByModel[model as keyof typeof revenueByModel] += ad.campaign.spentAmount;
    }
  });

  return revenueByModel;
}

function calculateProjectedRevenue(performanceData: any[], ads: any[]) {
  // Simple projection based on current daily average
  const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
  const days = Math.max(1, performanceData.length);
  const dailyAverage = totalRevenue / days;
  
  return {
    daily: dailyAverage,
    weekly: dailyAverage * 7,
    monthly: dailyAverage * 30,
    yearly: dailyAverage * 365
  };
}

function getRevenueShare(performanceData: any[], ads: any[]) {
  const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
  const revenueByAdvertiser = getPerformanceByAdvertiser(performanceData, ads);
  
  return revenueByAdvertiser.map(adv => ({
    advertiser: adv.advertiser,
    revenue: adv.revenue,
    percentage: totalRevenue > 0 ? (adv.revenue / totalRevenue) * 100 : 0
  }));
}
