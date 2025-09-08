# Google AdSense Integration Guide

## Overview
Google AdSense has been successfully integrated into SuperFacts.fr with your publisher ID: `ca-pub-6810963346035851`

## What was implemented:

### 1. AdSense Script Integration
- Added the Google AdSense script to `src/app/layout.tsx`
- Script loads automatically with your client ID from environment variables
- Proper Next.js integration with conditional loading

### 2. Environment Configuration
- Added `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6810963346035851` to `.env.local`
- This allows for easy management across different environments

### 3. AdSense Components
- Enhanced existing `GoogleAdSense` component in `src/components/ads/GoogleAdSense.tsx`
- Added utility components: `AdSenseHeader`, `AdSenseSidebar`, `AdSenseMobile`
- Components automatically use the environment variable for the client ID

### 4. Strategic Ad Placements
- **Header Banner**: Responsive 728x90 banner after the hero section
- **Sidebar Ad**: 300x250 rectangle in the right sidebar
- **Between Articles**: Responsive horizontal ads every 12th article in the feed

## Ad Slot IDs to Configure
You need to create these ad units in your Google AdSense account:

1. **Header Banner**: Replace `"1234567890"` with your actual ad slot ID
2. **Sidebar Ad**: Replace `"9876543210"` with your actual ad slot ID  
3. **Article Feed**: Replace `"5555555555"` with your actual ad slot ID

## How to Update Ad Slot IDs

### Option 1: Update in the code
Edit the following files and replace the placeholder ad slot IDs:
- `src/app/page.tsx` - lines with `adSlot="1234567890"` etc.

### Option 2: Add to environment variables (recommended)
Add to your `.env.local`:
```bash
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=your-actual-header-slot-id
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT=your-actual-sidebar-slot-id  
NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT=your-actual-article-slot-id
```

Then update the components to use these environment variables.

## Testing AdSense Integration

### Development Testing
1. Start your development server: `npm run dev`
2. Open browser developer tools
3. Look for AdSense script loading in Network tab
4. Check console for any AdSense-related errors

### Production Testing
1. Deploy your site with the AdSense integration
2. Wait 24-48 hours for Google to review your site
3. Ads should start appearing once approved

## Ad Performance Optimization

The integration includes:
- **Responsive ads** that adapt to different screen sizes
- **Proper spacing** with "Publicité" labels for French compliance
- **Smooth animations** using Framer Motion for better user experience
- **Strategic placement** to maximize viewability without hurting user experience

## Compliance Notes
- All ads include "Publicité" label for French advertising regulations
- Ads are clearly distinguished from content
- Mobile-friendly implementation included
- Privacy-compliant implementation ready

## Next Steps
1. Create actual ad units in your Google AdSense dashboard
2. Replace placeholder ad slot IDs with real ones
3. Test the integration in development
4. ✅ Deploy to production - **COMPLETED**
5. Monitor ad performance in AdSense dashboard

## Deployment Status

✅ **SUCCESSFULLY DEPLOYED TO PRODUCTION**

- **Live Site**: https://superfacts.fr
- **Latest Deployment**: https://superfacts-gqwlz5il2-vladimir08880888s-projects.vercel.app
- **AdSense Environment Variable**: Added to production environment
- **Build Status**: ✅ Successful
- **Deployment Time**: ~2 minutes ago

The Google AdSense integration is now live on your production site at superfacts.fr!

## Files Modified
- `src/app/layout.tsx` - Added AdSense script
- `.env.local` - Added client ID configuration  
- `src/components/ads/GoogleAdSense.tsx` - Enhanced component
- `src/app/page.tsx` - Added ad placements
- `ADSENSE_SETUP.md` - This documentation
