# Google Analytics Integration for SuperFacts.fr

This document explains how Google Analytics 4 (GA4) has been integrated into the SuperFacts.fr news platform.

## Overview

The Google Analytics implementation provides comprehensive tracking for:
- Page views and navigation
- Article interactions and reading patterns
- Search behavior and filtering
- Language switching and translations
- News collection activities
- User engagement metrics
- Content consumption patterns

## Setup Instructions

### 1. Get Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for SuperFacts.fr
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add your Measurement ID to the environment files:

**For production (`.env.production`):**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
```

**For development (`.env.local`):**
```env
# Leave empty to disable tracking in development
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Or use a separate test property
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOUR-TEST-ID
```

### 3. Deploy and Verify

After deployment, verify tracking in Google Analytics:
- Real-time reports should show active users
- Events should appear in the Events section
- Enhanced ecommerce data should be visible

## Features Implemented

### 1. Automatic Page View Tracking
- Tracks all page navigations automatically
- Includes page title and URL parameters
- Works with Next.js App Router

### 2. Article Engagement Tracking
- **Article Clicks**: When users click on articles
- **Reading Time**: Time spent viewing article cards
- **Content Consumption**: Enhanced ecommerce tracking for articles
- **PDF Downloads**: Track when articles are downloaded as PDFs
- **Bookmarking**: Track bookmark additions/removals

### 3. Search and Navigation
- **Search Queries**: Track search terms and result counts
- **Category Filtering**: Track category selections
- **Language Changes**: Track language switching behavior

### 4. News Operations
- **News Collection**: Track when news is collected from sources
- **Translation Usage**: Track text translations between languages
- **Fact Checking**: Track fact-checking feature usage
- **Sentiment Analysis**: Track sentiment analysis requests

### 5. User Behavior Analysis
- **Reading Sessions**: Track reading patterns and preferences
- **Preferred Categories**: Identify user category preferences
- **Time on Site**: Comprehensive time tracking

## Privacy and GDPR Compliance

The implementation includes privacy-focused settings:
- `anonymize_ip: true` - Anonymizes visitor IP addresses
- `allow_google_signals: false` - Disables Google Signals
- `allow_ad_personalization_signals: false` - Disables ad personalization
- `cookie_flags: 'secure;samesite=none'` - Secure cookie handling

## Code Structure

### Core Files

1. **`src/lib/analytics.ts`** - Core analytics functions and event definitions
2. **`src/hooks/useAnalytics.ts`** - React hooks for easy integration
3. **`src/app/layout.tsx`** - GA script initialization
4. **Environment files** - Configuration

### Key Components

#### Analytics Utility Functions
```typescript
import { trackEvent, newsEvents, userEvents } from '@/lib/analytics';

// Track custom events
trackEvent('custom_action', 'category', 'label', value, { custom: 'data' });

// Track news-specific events
newsEvents.articleClick(articleId, title, category, source);
newsEvents.search(query, resultsCount);
```

#### React Hooks
```typescript
import { useAnalytics, useSearchAnalytics } from '@/hooks/useAnalytics';

const Component = () => {
  const analytics = useAnalytics();
  const { trackSearchQuery } = useSearchAnalytics();
  
  // Analytics methods are automatically available
  analytics.trackArticleClick(id, title, category, source);
  trackSearchQuery(searchTerm, resultCount);
};
```

### Tracked Events

#### Article Engagement
- `article_click` - When articles are clicked
- `time_on_article` - Time spent reading articles
- `pdf_download` - PDF downloads
- `share` - Social sharing
- `recommendation_click` - Recommended article clicks

#### Navigation & Search
- `category_filter` - Category filtering
- `search` - Search queries with result counts
- `language_change` - Language switching

#### Content Operations
- `news_collection` - News collection activities
- `translation` - Text translation usage
- `fact_check` - Fact-checking requests
- `sentiment_analysis` - Sentiment analysis requests

#### User Behavior
- `reading_session` - Reading session summaries
- `preferred_categories` - Category preferences
- `purchase` - Enhanced ecommerce for content consumption

## Usage Examples

### Basic Event Tracking
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const analytics = useAnalytics();
  
  const handleButtonClick = () => {
    analytics.track('button_click', 'interaction', 'my_button');
  };
  
  return <button onClick={handleButtonClick}>Click me</button>;
};
```

### Article Time Tracking
```typescript
import { useArticleTimeTracking } from '@/hooks/useAnalytics';

const ArticleComponent = ({ articleId }) => {
  // Automatically tracks time spent on this article
  useArticleTimeTracking(articleId);
  
  return <div>Article content...</div>;
};
```

### Search Tracking
```typescript
import { useSearchAnalytics } from '@/hooks/useAnalytics';

const SearchComponent = () => {
  const { trackSearchQuery } = useSearchAnalytics();
  
  const handleSearch = (query, results) => {
    trackSearchQuery(query, results.length);
  };
  
  return <SearchInput onSearch={handleSearch} />;
};
```

## Debugging and Testing

### Development Mode
- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=""` to disable tracking
- Check browser console for analytics logs
- Use GA Debug View for real-time event verification

### Production Verification
1. Check Google Analytics Real-Time reports
2. Verify events are appearing in Events section
3. Monitor Enhanced Ecommerce data
4. Review Custom Dimensions and Metrics

### Common Issues
- **No data showing**: Check measurement ID format and environment variables
- **Events not firing**: Verify analytics hooks are properly initialized
- **Duplicate events**: Ensure components aren't re-mounting unnecessarily

## Custom Events

To add new custom events:

1. Add to `src/lib/analytics.ts`:
```typescript
export const customEvents = {
  newFeature: (data: string) => {
    trackEvent('new_feature_used', 'features', data);
  }
};
```

2. Use in components:
```typescript
import { customEvents } from '@/lib/analytics';

// Track the event
customEvents.newFeature('feature_data');
```

## Analytics Dashboard

Key metrics to monitor in Google Analytics:

### Engagement Metrics
- Page views and unique page views
- Average session duration
- Bounce rate by page/category
- Most read articles and categories

### Content Performance
- Article click-through rates
- PDF download rates
- Social sharing patterns
- Search query effectiveness

### User Behavior
- Language preference distribution
- Category browsing patterns
- Reading session lengths
- Return visitor patterns

### Technical Metrics
- News collection frequency
- Translation usage patterns
- Error rates and user flows

## Data Export and Analysis

Use Google Analytics 4's export features:
- **BigQuery Export**: For advanced analysis
- **Data Studio**: For custom dashboards
- **GA4 API**: For programmatic data access
- **Google Sheets Add-on**: For simple reporting

## Maintenance

### Regular Tasks
1. Review and clean up unused events
2. Monitor data quality and accuracy
3. Update tracking for new features
4. Optimize event structure based on insights

### Updates
- Keep analytics code updated with new GA4 features
- Review privacy settings regularly
- Update documentation for new team members
