'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AdPlacement, AdResponse } from '@/types/advertising';
import { motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';

interface BannerAdProps {
  placement: AdPlacement;
  className?: string;
  userContext: {
    language: string;
    country?: string;
    device: 'mobile' | 'desktop' | 'tablet';
    categories: string[];
    currentUrl: string;
  };
}

export default function BannerAd({ placement, className = '', userContext }: BannerAdProps) {
  const [adData, setAdData] = useState<AdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

      const adElement = document.getElementById(`banner-ad-${adData.ad?.id}`);
      if (adElement) {
        observer.observe(adElement);
      }

      return () => observer.disconnect();
    }
  }, [adData, isVisible]);

  const loadAd = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ads/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placement,
          userContext,
          slotInfo: {
            id: `banner-${placement}`,
            placement,
            dimensions: getBannerDimensions(placement),
            isResponsive: true,
            maxAds: 1
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ad) {
          setAdData(data.ad);
        }
      }
    } catch (error) {
      console.error('Failed to load ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBannerDimensions = (placement: AdPlacement) => {
    switch (placement) {
      case AdPlacement.HEADER:
        return { width: 728, height: 90 };
      case AdPlacement.SIDEBAR:
        return { width: 300, height: 250 };
      case AdPlacement.MOBILE_STICKY:
        return { width: 320, height: 50 };
      default:
        return { width: 728, height: 90 };
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

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading) {
    return (
      <div className={`banner-ad-skeleton ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg" 
             style={getBannerDimensions(placement)} />
      </div>
    );
  }

  if (!adData?.ad || dismissed) {
    return null;
  }

  const { ad } = adData;
  const dimensions = getBannerDimensions(placement);

  // Handle custom code (e.g., Google AdSense)
  if (ad.customCode) {
    return (
      <motion.div
        id={`banner-ad-${ad.id}`}
        className={`banner-ad custom-ad relative ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: dimensions.width }}
      >
        {/* Sponsored label */}
        <div className="absolute top-1 left-1 z-10">
          <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded text-opacity-90">
            Sponsorisé
          </span>
        </div>
        
        {/* Custom ad code (AdSense, etc.) */}
        <div 
          className="custom-ad-content"
          dangerouslySetInnerHTML={{ __html: ad.customCode }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      id={`banner-ad-${ad.id}`}
      className={`banner-ad relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: dimensions.width }}
    >
      {/* Sponsored label */}
      <div className="absolute top-1 left-1 z-10">
        <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded text-opacity-90">
          Sponsorisé
        </span>
      </div>

      {/* Dismiss button for mobile sticky ads */}
      {placement === AdPlacement.MOBILE_STICKY && (
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 z-10 bg-gray-600 text-white rounded-full p-1 hover:bg-gray-700 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Ad content */}
      <div
        className="cursor-pointer hover:opacity-90 transition-opacity group"
        onClick={handleClick}
        style={{
          width: '100%',
          maxWidth: dimensions.width,
          aspectRatio: `${dimensions.width}/${dimensions.height}`
        }}
      >
        {ad.imageUrl ? (
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              sizes={`${dimensions.width}px`}
              className="object-cover"
              onError={(e) => {
                // Fallback to text-based ad if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            
            {/* Overlay for text-based fallback */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white p-4">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
                <p className="text-sm opacity-90 mb-3">{ad.content}</p>
                <div className="flex items-center justify-center text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Cliquez pour en savoir plus
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Text-only ad
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 h-full flex items-center justify-center"
            style={{ minHeight: dimensions.height }}
          >
            <div className="text-center">
              <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
              <p className="text-sm opacity-90 mb-3">{ad.content}</p>
              <div className="flex items-center justify-center text-xs group-hover:underline">
                <ExternalLink className="w-3 h-3 mr-1" />
                Cliquez pour en savoir plus
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advertiser info */}
      <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
        <span>Annonceur: {ad.advertiser.name}</span>
        <span className="text-xs opacity-60">Publicité</span>
      </div>
    </motion.div>
  );
}
