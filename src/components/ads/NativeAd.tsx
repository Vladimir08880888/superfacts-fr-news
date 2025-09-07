'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AdPlacement, AdResponse, NativeAd as NativeAdType } from '@/types/advertising';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Eye } from 'lucide-react';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface NativeAdProps {
  placement: AdPlacement;
  className?: string;
  variant?: 'default' | 'featured' | 'compact';
  userContext: {
    language: string;
    country?: string;
    device: 'mobile' | 'desktop' | 'tablet';
    categories: string[];
    currentUrl: string;
  };
}

export default function NativeAd({ 
  placement, 
  className = '', 
  variant = 'default',
  userContext 
}: NativeAdProps) {
  const [adData, setAdData] = useState<AdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  const sponsoredText = useTranslatedText('Sponsorisé');
  const readMoreText = useTranslatedText('Lire la suite');

  useEffect(() => {
    loadAd();
  }, [placement, userContext]);

  useEffect(() => {
    if (adData) {
      // Track impression when ad becomes visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              trackImpression();
            }
          });
        },
        { threshold: 0.5 }
      );

      const adElement = document.getElementById(`native-ad-${adData.ad?.id}`);
      if (adElement) {
        observer.observe(adElement);
      }

      return () => observer.disconnect();
    }
  }, [adData, isVisible]);

  const loadAd = async () => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('/api/ads/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placement,
          userContext,
          slotInfo: {
            id: `native-${placement}`,
            placement,
            dimensions: { width: 400, height: 300 },
            isResponsive: true,
            maxAds: 1
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ad) {
          setAdData(data.ad);
        }
      }
    } catch (error) {
      // Don't log network errors in development - they're expected during dev server startup
      if (process.env.NODE_ENV === 'development' && 
          (error instanceof Error && 
           (error.name === 'AbortError' || error.message.includes('fetch')))) {
        return; // Silently fail in development
      }
      console.warn('Failed to load ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async () => {
    if (!adData?.ad) return;

    try {
      await fetch(adData.tracking.impressionUrl);
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const handleClick = async () => {
    if (!adData?.ad) return;

    try {
      // Track click
      await fetch(adData.tracking.clickUrl);
      
      // Open target URL
      window.open(adData.ad.targetUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  if (loading) {
    return (
      <div className={`native-ad-skeleton ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4" />
          <div className="bg-gray-200 h-4 rounded mb-2" />
          <div className="bg-gray-200 h-3 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!adData?.ad) {
    return null;
  }

  const ad = adData.ad as NativeAdType;

  const renderFeaturedAd = () => (
    <motion.article
      id={`native-ad-${ad.id}`}
      className={`native-ad featured-ad cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative bg-white rounded-xl shadow-md overflow-hidden border border-yellow-200">
        {/* Sponsored badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            {sponsoredText.translatedText}
          </span>
        </div>

        {/* Image */}
        {ad.imageUrl && (
          <div className="relative h-64 w-full">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20" />
          </div>
        )}

        <div className="p-6">
          {/* Category and date */}
          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {ad.category}
            </span>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{ad.readTime} min de lecture</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
            {ad.title}
          </h2>

          {/* Excerpt */}
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {ad.excerpt || ad.content}
          </p>

          {/* Author and CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {ad.author?.charAt(0) || ad.advertiser.name.charAt(0)}
                </span>
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-900">
                  {ad.author || ad.advertiser.name}
                </p>
                <p className="text-xs text-gray-500">Contenu sponsorisé</p>
              </div>
            </div>
            
            <div className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <span className="text-sm font-medium mr-1">{readMoreText.translatedText}</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );

  const renderDefaultAd = () => (
    <motion.article
      id={`native-ad-${ad.id}`}
      className={`native-ad default-ad cursor-pointer hover:shadow-md transition-all duration-300 ${className}`}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-yellow-100 hover:border-yellow-200">
        {/* Sponsored badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-yellow-400 text-black text-xs font-medium px-2 py-1 rounded">
            {sponsoredText.translatedText}
          </span>
        </div>

        <div className="flex">
          {/* Image */}
          {ad.imageUrl && (
            <div className="relative w-1/3 h-32">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                sizes="(max-width: 768px) 33vw, 200px"
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className={`${ad.imageUrl ? 'w-2/3' : 'w-full'} p-4`}>
            <div className="mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {ad.category}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              {ad.title}
            </h3>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {ad.excerpt || ad.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Par {ad.author || ad.advertiser.name}
              </div>
              <div className="flex items-center text-blue-600 text-sm">
                <Clock className="w-3 h-3 mr-1" />
                <span>{ad.readTime} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );

  const renderCompactAd = () => (
    <motion.article
      id={`native-ad-${ad.id}`}
      className={`native-ad compact-ad cursor-pointer hover:bg-gray-50 transition-all duration-300 ${className}`}
      onClick={handleClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center p-3 border border-yellow-100 rounded-lg">
        {/* Sponsored indicator */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
        </div>

        {/* Image */}
        {ad.imageUrl && (
          <div className="relative w-16 h-16 flex-shrink-0 mr-3">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              sizes="64px"
              className="object-cover rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1 hover:text-blue-600 transition-colors">
            {ad.title}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-1 mb-1">
            {ad.excerpt || ad.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-yellow-600 font-medium">Sponsorisé</span>
            <div className="flex items-center text-xs text-gray-500">
              <Eye className="w-3 h-3 mr-1" />
              <span>{ad.readTime} min</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 ml-2">
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </motion.article>
  );

  switch (variant) {
    case 'featured':
      return renderFeaturedAd();
    case 'compact':
      return renderCompactAd();
    default:
      return renderDefaultAd();
  }
}
