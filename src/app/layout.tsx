import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from '@/contexts/TranslationContext';
import { BookmarksProvider } from '@/contexts/BookmarksContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RecommendationsProvider } from '@/contexts/RecommendationsContext';
import { UserProvider } from '@/contexts/UserContext';

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
    "actualités", "news", "france", "information", "journal", "presse", 
    "politique", "économie", "sport", "culture", "international", "technologie",
    "Le Monde", "Le Figaro", "France 24", "BFM TV", "temps réel"
  ],
  authors: [{ name: "SuperFacts Team" }],
  creator: "SuperFacts.fr",
  publisher: "SuperFacts.fr",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://superfacts.fr'),
  alternates: {
    canonical: '/',
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
                </RecommendationsProvider>
              </BookmarksProvider>
            </TranslationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
