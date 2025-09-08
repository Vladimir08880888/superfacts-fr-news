'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface GoogleAdSenseProps {
  adClient?: string; // ca-pub-XXXXXXXXXX (optional, uses env var by default)
  adSlot: string;    // Ad slot ID
  width?: number;
  height?: number;
  className?: string;
  responsive?: boolean;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

export default function GoogleAdSense({
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adSlot,
  width = 728,
  height = 90,
  className = '',
  responsive = true,
  format = 'auto',
  style = {}
}: GoogleAdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    const loadAd = () => {
      try {
        // Only proceed if AdSense client ID and slot are available
        if (!adClient) {
          setAdError('AdSense client ID not configured');
          return;
        }

        if (!adSlot || adSlot === '1234567890' || adSlot === '5555555555' || adSlot === '9876543210') {
          setAdError('Valid ad slot ID required');
          return;
        }

        // Wait for the ad element to be in the DOM
        if (!adRef.current) {
          setAdError('Ad container not ready');
          return;
        }

        // Check if the ad container has proper dimensions
        const rect = adRef.current.getBoundingClientRect();
        if (rect.width < 10) {
          console.warn('AdSense container width too small:', rect.width);
        }

        // Initialize adsbygoogle array if it doesn't exist
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        // Check if the ad was already loaded
        const insElement = adRef.current.querySelector('ins.adsbygoogle');
        if (insElement && insElement.getAttribute('data-adsbygoogle-status')) {
          return; // Ad already loaded
        }

        // Push ad to the queue
        window.adsbygoogle.push({});
        setAdLoaded(true);
        setAdError(null);
      } catch (error) {
        console.error('AdSense error:', error);
        setAdError(error instanceof Error ? error.message : 'Ad loading failed');
      }
    };

    // Wait a bit for the DOM to be fully ready
    const timeoutId = setTimeout(loadAd, 100);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [adClient, adSlot]);

  const adStyle = {
    ...style,
    ...(responsive 
      ? { display: 'block', width: '100%', minHeight: `${height}px` }
      : { display: 'inline-block', width: `${width}px`, height: `${height}px` })
  };

  // Show error state for development
  if (adError && process.env.NODE_ENV === 'development') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`google-adsense-container ${className} border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600`}
      >
        <div className="text-xs text-gray-500 text-center mb-1">
          AdSense (Dev Mode)
        </div>
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <div>⚠️ {adError}</div>
          <div className="mt-1 text-xs">Slot: {adSlot}</div>
        </div>
      </motion.div>
    );
  }

  // Don't render if no client ID in production
  if (!adClient) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`google-adsense-container ${className}`}
    >
      {/* Sponsored label */}
      <div className="text-xs text-gray-500 text-center mb-1">
        Publicité
      </div>

      <div ref={adRef} className="adsense-wrapper" style={{ minHeight: responsive ? `${height}px` : undefined }}>
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={responsive ? format : undefined}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </motion.div>
  );
}

// Utility component for common AdSense placements
export function AdSenseHeader({ adClient, adSlot }: { adClient?: string; adSlot: string }) {
  return (
    <GoogleAdSense
      adClient={adClient}
      adSlot={adSlot}
      width={728}
      height={90}
      className="adsense-header"
      responsive={true}
      format="horizontal"
    />
  );
}

export function AdSenseSidebar({ adClient, adSlot }: { adClient?: string; adSlot: string }) {
  return (
    <GoogleAdSense
      adClient={adClient}
      adSlot={adSlot}
      width={300}
      height={250}
      className="adsense-sidebar"
      responsive={true}
      format="rectangle"
    />
  );
}

export function AdSenseMobile({ adClient, adSlot }: { adClient?: string; adSlot: string }) {
  return (
    <GoogleAdSense
      adClient={adClient}
      adSlot={adSlot}
      width={320}
      height={50}
      className="adsense-mobile"
      responsive={true}
      format="horizontal"
    />
  );
}

// Higher-order component for easy AdSense integration
export function withAdSense(Component: React.ComponentType<Record<string, unknown>>) {
  return function AdSenseWrappedComponent(props: Record<string, unknown>) {
    return (
      <>
        <Component {...props} />
        {/* You can add default AdSense ads here */}
      </>
    );
  };
}
