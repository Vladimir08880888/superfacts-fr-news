'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GoogleAdSenseProps {
  adClient?: string; // ca-pub-XXXXXXXXXX (optional, uses env var by default)
  adSlot: string;    // Ad slot ID
  width?: number;
  height?: number;
  className?: string;
  responsive?: boolean;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAdSense({
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adSlot,
  width = 728,
  height = 90,
  className = '',
  responsive = true,
  format = 'auto'
}: GoogleAdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Only proceed if AdSense client ID is available
      if (!adClient) {
        console.warn('AdSense client ID not found. Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in your environment variables.');
        return;
      }

      // Initialize adsbygoogle array if it doesn't exist
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }

      // Push ad to the queue
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adClient]);

  const adStyle = responsive 
    ? { display: 'block', width: '100%' }
    : { display: 'inline-block', width: `${width}px`, height: `${height}px` };

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

      <div ref={adRef} className="adsense-wrapper">
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
export function withAdSense(Component: React.ComponentType<any>) {
  return function AdSenseWrappedComponent(props: any) {
    return (
      <>
        <Component {...props} />
        {/* You can add default AdSense ads here */}
      </>
    );
  };
}
