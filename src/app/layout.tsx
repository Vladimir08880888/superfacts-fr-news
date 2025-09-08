import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { BookmarksProvider } from '@/contexts/BookmarksContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RecommendationsProvider } from '@/contexts/RecommendationsContext';
import { UserProvider } from '@/contexts/UserContext';
import Footer from '@/components/Footer';
import MobileStickyAd from '@/components/ads/MobileStickyAd';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SuperFacts.fr - Actualités françaises en temps réel",
    template: "%s | SuperFacts.fr"
  },
  description: "Découvrez toute l'actualité française agrégée en temps réel depuis les plus grandes sources d'information : Le Monde, Le Figaro, France 24, Liberation, BFM TV et bien plus.",
  keywords: [
    "actualités france", "news france", "information temps réel", "journal français", "presse française", 
    "politique france", "économie française", "sport france", "culture france", "international france", "technologie france",
    "Le Monde actualités", "Le Figaro news", "France 24 direct", "BFM TV live", "Liberation info",
    "agrégateur actualités", "flux RSS france", "breaking news france", "dernières nouvelles"
  ],
  authors: [{ name: "SuperFacts Team", url: "https://superfacts.fr" }],
  creator: "SuperFacts.fr",
  publisher: "SuperFacts.fr",
  applicationName: "SuperFacts",
  referrer: "origin-when-cross-origin",
  category: "News",
  classification: "News Aggregator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://superfacts.fr'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/',
      'en-US': '/en',
      'es-ES': '/es',
      'de-DE': '/de',
    },
  },
  openGraph: {
    title: "SuperFacts.fr - Actualités françaises en temps réel",
    description: "Découvrez toute l'actualité française agrégée en temps réel depuis les plus grandes sources d'information.",
    url: 'https://superfacts.fr',
    siteName: 'SuperFacts.fr',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SuperFacts.fr - Actualités françaises',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "SuperFacts.fr - Actualités françaises en temps réel",
    description: "Découvrez toute l'actualité française agrégée en temps réel.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SuperFacts',
    startupImage: [
      {
        url: '/splash-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash-750x1334.png', 
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SuperFacts',
    'application-name': 'SuperFacts',
    'msapplication-TileColor': '#2563eb',
    'msapplication-tap-highlight': 'no',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Google AdSense Site Verification */}
        <meta name="google-adsense-account" content="ca-pub-6810963346035851" />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                    cookie_flags: 'secure;samesite=none',
                    anonymize_ip: true,
                    allow_google_signals: false,
                    allow_ad_personalization_signals: false
                  });
                `,
              }}
            />
          </>
        )}
        {/* Google AdSense */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
        {/* Структурированные данные JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              "name": "SuperFacts.fr",
              "url": "https://superfacts.fr",
              "logo": {
                "@type": "ImageObject",
                "url": "https://superfacts.fr/logo.png",
                "width": 512,
                "height": 512
              },
              "sameAs": [
                "https://twitter.com/superfacts_fr",
                "https://facebook.com/superfacts.fr"
              ],
              "description": "Actualités françaises en temps réel agrégées depuis les plus grandes sources d'information",
              "foundingDate": "2024",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "FR"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "contact@superfacts.fr"
              },
              "publishingPrinciples": "https://superfacts.fr/editorial-guidelines",
              "ethicsPolicy": "https://superfacts.fr/ethics"
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      // Проверяем периодическую синхронизацию
                      if ('periodicSync' in registration) {
                        registration.periodicSync.register('news-refresh', {
                          minInterval: 24 * 60 * 60 * 1000, // 24 часа
                        }).catch(err => console.log('Periodic sync failed:', err));
                      }
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <UserProvider>
            <TranslationProvider>
              <BookmarksProvider>
                <RecommendationsProvider>
                  {children}
                  <Footer />
                  <MobileStickyAd />
                  <Analytics mode="production" />
                </RecommendationsProvider>
              </BookmarksProvider>
            </TranslationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
