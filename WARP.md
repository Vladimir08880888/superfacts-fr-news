# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SuperFacts.fr is a French news aggregation platform built with Next.js 15, featuring:
- Real-time news collection from 20+ major French media sources (Le Monde, Le Figaro, Libération, etc.)
- Multi-language translation support (12 languages)
- Advanced news categorization and sentiment analysis
- Modern React UI with Framer Motion animations
- RSS feed parsing and intelligent content extraction

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### News Collection
```bash
# Collect news (TypeScript version)
npm run collect-news-ts

# Collect news (JavaScript version, requires build)
npm run collect-news
```

### Single Test Runs
```bash
# Run specific test file (when tests are added)
npm test -- path/to/test-file

# Run API route tests
npm test -- src/app/api

# Run component tests
npm test -- src/components
```

## Architecture Overview

### News Collection System
- **FrenchNewsCollector** (`src/lib/news-collector.ts`): Core service that aggregates news from 20+ French sources
- **RSS Parsing**: Uses `rss-parser` to extract content from various media outlets
- **Content Processing**: Intelligent image extraction, duplicate detection, and text cleaning
- **Categorization**: Automatic categorization into Politics, Economy, Tech, Sports, Culture, etc.
- **Data Storage**: JSON file-based storage in `data/articles.json` (up to 1000 articles)

### API Layer
The application exposes several REST endpoints in `src/app/api/`:
- `GET /api/news` - Retrieve articles with filtering and pagination
- `POST /api/collect` - Trigger news collection
- `POST /api/translate` - Handle text translations
- `POST /api/fact-check` - Fact-checking functionality
- `POST /api/sentiment-analysis` - Analyze article sentiment
- `POST /api/recommendations` - Get personalized recommendations

### Translation System
- **TranslationContext** (`src/contexts/TranslationContext.tsx`): Global translation state management
- **Multi-language Support**: 12 languages with caching
- **Translation Cache**: 24-hour cache with localStorage persistence
- **useTranslatedText Hook**: Automatic text translation with loading states

### UI Components Architecture
- **Header Component**: Navigation, search, category filtering, and mobile menu
- **ArticleCard**: Flexible article display with multiple variants (featured, default, compact)
- **LanguageSelector**: Language switching with flag icons
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### State Management
- React Context for translation state
- Local state management with hooks
- No external state management library (Redux, Zustand)

## Key Configuration Files

### Next.js Configuration
- **Image Domains**: Pre-configured for 20+ French media outlets
- **Security Headers**: CSP, frame options, content type protection
- **Compression**: Enabled for production
- **React Strict Mode**: Enabled

### Styling
- **Tailwind CSS v4**: Custom utilities for line clamping and animations
- **Framer Motion**: Page transitions and micro-interactions
- **Custom Animations**: Spin-slow, pulse-soft variants

### TypeScript Configuration
- **Strict Mode**: Enabled
- **Path Aliases**: `@/*` maps to `./src/*`
- **ES2017 Target**: Modern JavaScript features

## Media Source Management

The news collector is configured for major French media outlets:
- **General News**: Le Monde, Le Figaro, Libération, France 24, France Info, BFM TV
- **Economy**: Les Échos, La Tribune, Challenges, Capital
- **Technology**: 01net, Clubic, Futura Sciences
- **Sports**: L'Équipe, RMC Sport
- **Culture**: Télérama, Les Inrockuptibles
- **Regional**: Ouest-France, 20 Minutes

Each source has custom content extraction strategies for optimal image and content retrieval.

## Development Guidelines

### News Collection
- New sources should be added to the `sources` array in `FrenchNewsCollector`
- Each source requires: `name`, `url`, `category`, and optional `logo` and `selector` properties
- Image extraction includes fallback strategies for different RSS formats

### API Development
- All API routes use Next.js 15 App Router conventions
- Routes should return consistent JSON responses with `success` and `error` fields
- Implement proper error handling and HTTP status codes

### Component Development
- Use TypeScript interfaces for all props
- Implement proper loading states for async operations
- Follow the established pattern for translated text using `useTranslatedText`
- Maintain responsive design with mobile-first approach

### Translation Integration
- All user-facing text should use `useTranslatedText` hook
- Cache translations locally for performance
- Handle translation errors gracefully by falling back to original text

## File Organization

```
src/
├── app/
│   ├── api/           # Next.js API routes
│   ├── layout.tsx     # Root layout with metadata
│   └── page.tsx       # Main news feed page
├── components/        # Reusable UI components
├── contexts/          # React contexts (translation)
├── lib/              # Core business logic and utilities
└── types/            # TypeScript type definitions
```

## Performance Considerations

- **Image Optimization**: Next.js Image component with multiple domains configured
- **Translation Caching**: 24-hour cache with localStorage
- **News Collection**: Batched processing with duplicate detection
- **Bundle Optimization**: Package imports optimized for Framer Motion and Lucide React

## Security Features

- ESLint ignored during builds for faster deployment
- Comprehensive security headers in Next.js config
- Content Security Policy for SVG handling
- XSS protection and frame options configured

## News Content Quality

The system implements sophisticated content processing:
- **Duplicate Detection**: Levenshtein distance algorithm for similarity matching
- **Content Extraction**: Multi-strategy approach for different media formats
- **Sentiment Analysis**: Basic keyword-based sentiment detection
- **Read Time Calculation**: Automatic estimation based on word count
- **Hot News Detection**: Recent articles marked as trending content
