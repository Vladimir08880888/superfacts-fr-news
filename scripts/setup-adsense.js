const fs = require('fs');
const path = require('path');

// Configuration for AdSense (you need to replace with your actual values)
const ADSENSE_CONFIG = {
  CLIENT_ID: 'ca-pub-0000000000000000', // Replace with your actual AdSense client ID
  SLOTS: {
    HEADER: '1234567890',    // Replace with your header ad slot ID
    SIDEBAR: '2345678901',   // Replace with your sidebar ad slot ID
    FOOTER: '3456789012',    // Replace with your footer ad slot ID
    MOBILE: '4567890123'     // Replace with your mobile ad slot ID
  }
};

console.log('🚀 Setting up Google AdSense for SuperFacts.fr\n');

// Step 1: Create AdSense ads configuration
const adsenseAds = [
  {
    id: 'adsense-header-banner',
    type: 'banner',
    title: 'Google AdSense Header',
    content: 'Publicité Google AdSense',
    imageUrl: '',
    targetUrl: '',
    customCode: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.CLIENT_ID}" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${ADSENSE_CONFIG.CLIENT_ID}"
     data-ad-slot="${ADSENSE_CONFIG.SLOTS.HEADER}"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    advertiser: {
      id: 'google-adsense',
      name: 'Google AdSense',
      email: 'noreply@google.com',
      company: 'Google LLC',
      website: 'https://www.google.com/adsense/',
      contactInfo: {
        phone: '',
        address: '',
        city: '',
        country: 'US',
        postalCode: ''
      },
      billingInfo: {
        paymentMethod: 'automatic',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'adsense-campaign-header',
      name: 'Google AdSense - Header Campaign',
      description: 'Automatic Google AdSense header advertisements',
      budget: 999999,
      dailyBudget: 999999,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['all'],
      languages: ['fr', 'en'],
      countries: ['FR', 'BE', 'CH', 'CA'],
      devices: ['mobile', 'desktop', 'tablet'],
      keywords: ['actualités', 'news', 'france', 'information']
    },
    placement: 'header',
    pricing: {
      model: 'cpm',
      rate: 0, // AdSense handles pricing automatically
      currency: 'EUR',
      minBudget: 0
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adsense-sidebar-banner',
    type: 'banner',
    title: 'Google AdSense Sidebar',
    content: 'Publicité Google AdSense - Sidebar',
    imageUrl: '',
    targetUrl: '',
    customCode: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.CLIENT_ID}" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${ADSENSE_CONFIG.CLIENT_ID}"
     data-ad-slot="${ADSENSE_CONFIG.SLOTS.SIDEBAR}"
     data-ad-format="rectangle"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    advertiser: {
      id: 'google-adsense',
      name: 'Google AdSense',
      email: 'noreply@google.com',
      company: 'Google LLC',
      website: 'https://www.google.com/adsense/',
      contactInfo: {
        phone: '',
        address: '',
        city: '',
        country: 'US',
        postalCode: ''
      },
      billingInfo: {
        paymentMethod: 'automatic',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'adsense-campaign-sidebar',
      name: 'Google AdSense - Sidebar Campaign',
      description: 'Automatic Google AdSense sidebar advertisements',
      budget: 999999,
      dailyBudget: 999999,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['all'],
      languages: ['fr', 'en'],
      countries: ['FR', 'BE', 'CH', 'CA'],
      devices: ['desktop', 'tablet'],
      keywords: ['actualités', 'news', 'france', 'information']
    },
    placement: 'sidebar',
    pricing: {
      model: 'cpm',
      rate: 0,
      currency: 'EUR',
      minBudget: 0
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adsense-mobile-sticky',
    type: 'banner',
    title: 'Google AdSense Mobile',
    content: 'Publicité Google AdSense - Mobile',
    imageUrl: '',
    targetUrl: '',
    customCode: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.CLIENT_ID}" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${ADSENSE_CONFIG.CLIENT_ID}"
     data-ad-slot="${ADSENSE_CONFIG.SLOTS.MOBILE}"
     data-ad-format="horizontal"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    advertiser: {
      id: 'google-adsense',
      name: 'Google AdSense',
      email: 'noreply@google.com',
      company: 'Google LLC',
      website: 'https://www.google.com/adsense/',
      contactInfo: {
        phone: '',
        address: '',
        city: '',
        country: 'US',
        postalCode: ''
      },
      billingInfo: {
        paymentMethod: 'automatic',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'adsense-campaign-mobile',
      name: 'Google AdSense - Mobile Campaign',
      description: 'Automatic Google AdSense mobile advertisements',
      budget: 999999,
      dailyBudget: 999999,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['all'],
      languages: ['fr', 'en'],
      countries: ['FR', 'BE', 'CH', 'CA'],
      devices: ['mobile'],
      keywords: ['actualités', 'news', 'france', 'information']
    },
    placement: 'mobile_sticky',
    pricing: {
      model: 'cpm',
      rate: 0,
      currency: 'EUR',
      minBudget: 0
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Step 2: Load existing ads and merge with AdSense ads
const dataDir = path.join(__dirname, '..', 'data');
const adsFilePath = path.join(dataDir, 'ads.json');

let existingAds = [];
try {
  const existingData = fs.readFileSync(adsFilePath, 'utf-8');
  existingAds = JSON.parse(existingData);
  console.log(`📚 Loaded ${existingAds.length} existing ads`);
} catch (error) {
  console.log('📄 No existing ads file found, creating new one');
}

// Remove old AdSense ads and add new ones
const filteredAds = existingAds.filter(ad => !ad.id.startsWith('adsense-'));
const allAds = [...filteredAds, ...adsenseAds];

// Step 3: Save updated ads
fs.writeFileSync(adsFilePath, JSON.stringify(allAds, null, 2));

console.log(`✅ AdSense configuration complete!`);
console.log(`📊 Total ads: ${allAds.length} (${adsenseAds.length} AdSense ads added)`);

// Step 4: Create environment variables template
const envTemplate = `
# Google AdSense Configuration
NEXT_PUBLIC_ADSENSE_CLIENT_ID=${ADSENSE_CONFIG.CLIENT_ID}
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=${ADSENSE_CONFIG.SLOTS.HEADER}
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT=${ADSENSE_CONFIG.SLOTS.SIDEBAR}
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT=${ADSENSE_CONFIG.SLOTS.FOOTER}
NEXT_PUBLIC_ADSENSE_MOBILE_SLOT=${ADSENSE_CONFIG.SLOTS.MOBILE}
`;

const envPath = path.join(__dirname, '..', '.env.adsense');
fs.writeFileSync(envPath, envTemplate.trim());

console.log(`\n🔧 Environment variables template created: .env.adsense`);
console.log('   Copy these variables to your .env.local file after updating with real values\n');

// Step 5: Instructions
console.log('📋 Next Steps:');
console.log('1. 📝 Update the CLIENT_ID and SLOT values in this script with your real AdSense data');
console.log('2. 🔄 Run this script again: node scripts/setup-adsense.js');
console.log('3. 🚀 Start your development server: npm run dev');
console.log('4. 👀 Visit your site to see AdSense ads in action');
console.log('\n💡 To get your AdSense codes:');
console.log('   - Visit https://www.google.com/adsense/');
console.log('   - Create ad units for header (728x90), sidebar (300x250), and mobile (320x50)');
console.log('   - Copy the client ID and slot IDs from the generated code');

if (ADSENSE_CONFIG.CLIENT_ID === 'ca-pub-0000000000000000') {
  console.log('\n⚠️  WARNING: You are still using placeholder AdSense codes!');
  console.log('   Please update the ADSENSE_CONFIG object in this script with your real AdSense data.');
}
