'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AdPlacement } from '@/types/advertising';
import BannerAd from './BannerAd';
import { useAdContext } from '@/hooks/useAdContext';

interface MobileStickyAdProps {
  userContext?: {
    language: string;
    country?: string;
    device: 'mobile' | 'desktop' | 'tablet';
    categories: string[];
    currentUrl: string;
  };
}

export default function MobileStickyAd({ userContext: propUserContext }: MobileStickyAdProps) {
  const defaultUserContext = useAdContext();
  const userContext = propUserContext || defaultUserContext;
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice && !isDismissed) {
        // Show after 3 seconds of page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isDismissed]);

  // Hide on scroll up (optional UX improvement)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY - 50) {
        // Scrolling up significantly
        setIsVisible(false);
      }
      
      lastScrollY = currentScrollY;
    };

    if (isMobile && !isDismissed) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    
    // Remember dismissal for 24 hours
    localStorage.setItem('mobileStickyAdDismissed', Date.now().toString());
  };

  // Check if previously dismissed within 24 hours
  useEffect(() => {
    const dismissedTime = localStorage.getItem('mobileStickyAdDismissed');
    if (dismissedTime) {
      const hoursSinceDismissal = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('mobileStickyAdDismissed');
      }
    }
  }, []);

  if (!isMobile || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop/Spacer to prevent content jumping */}
          <div className="h-16" />
          
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 400,
              duration: 0.3 
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-700"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-200"
              aria-label="Fermer la publicité"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Ad Content */}
            <div className="px-2 py-3">
              <BannerAd
                placement={AdPlacement.MOBILE_STICKY}
                userContext={userContext}
                className="w-full max-w-none"
              />
            </div>

            {/* Visual indicator for dismissal */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
