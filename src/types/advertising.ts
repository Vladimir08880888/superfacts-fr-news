export interface Advertisement {
  id: string;
  type: AdType;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  targetUrl: string;
  customCode?: string; // For external ad networks (AdSense, etc.)
  advertiser: Advertiser;
  campaign: Campaign;
  targeting: AdTargeting;
  placement: AdPlacement;
  pricing: AdPricing;
  status: AdStatus;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date;
  endDate: Date;
}

export enum AdType {
  BANNER = 'banner',
  NATIVE = 'native',
  VIDEO = 'video',
  SPONSORED_ARTICLE = 'sponsored_article',
  POPUP = 'popup',
  SIDEBAR = 'sidebar',
  INTERSTITIAL = 'interstitial'
}

export enum AdPlacement {
  HEADER = 'header',
  SIDEBAR = 'sidebar',
  ARTICLE_TOP = 'article_top',
  ARTICLE_MIDDLE = 'article_middle',
  ARTICLE_BOTTOM = 'article_bottom',
  BETWEEN_ARTICLES = 'between_articles',
  FOOTER = 'footer',
  MOBILE_STICKY = 'mobile_sticky'
}

export enum AdStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export interface Advertiser {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string;
  logo?: string;
  contactInfo: ContactInfo;
  billingInfo: BillingInfo;
  createdAt: Date;
  isVerified: boolean;
}

export interface ContactInfo {
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface BillingInfo {
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  currency: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  dailyBudget: number;
  spentAmount: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: Date;
  endDate: Date;
  status: AdStatus;
}

export interface AdTargeting {
  categories: string[];
  languages: string[];
  countries: string[];
  devices: ('mobile' | 'desktop' | 'tablet')[];
  timeOfDay?: {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
  };
  daysOfWeek?: number[]; // 0-6, 0 = Sunday
  keywords: string[];
}

export interface AdPricing {
  model: 'cpm' | 'cpc' | 'cpa' | 'fixed';
  rate: number; // Price per thousand impressions, per click, per action, or fixed price
  currency: string;
  minBudget: number;
}

export interface AdPerformance {
  adId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  cpm: number; // Cost per mille
  cpc: number; // Cost per click
}

export interface AdSlot {
  id: string;
  placement: AdPlacement;
  dimensions: {
    width: number;
    height: number;
  };
  isResponsive: boolean;
  maxAds: number;
  rotationInterval?: number; // in seconds
}

// Native ad that looks like a news article
export interface NativeAd extends Advertisement {
  excerpt: string;
  author: string;
  publishDate: Date;
  category: string;
  isSponsored: true;
  readTime: number;
}

// Video ad configuration
export interface VideoAd extends Advertisement {
  duration: number; // in seconds
  skipAfter?: number; // seconds after which skip button appears
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
}

export interface AdRequest {
  placement: AdPlacement;
  userContext: {
    language: string;
    country?: string;
    device: 'mobile' | 'desktop' | 'tablet';
    categories: string[];
    currentUrl: string;
  };
  slotInfo: AdSlot;
}

export interface AdResponse {
  ad: Advertisement | null;
  tracking: {
    impressionUrl: string;
    clickUrl: string;
  };
  refreshAfter?: number; // seconds
}
