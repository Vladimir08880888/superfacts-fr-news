import { adManager } from '../src/lib/ad-manager';

async function initializeAds() {
  console.log('Initializing advertising system with sample ads...');
  
  try {
    await adManager.createSampleAds();
    console.log('✅ Sample ads created successfully!');
    
    // Verify ads were created
    const ads = await adManager.getAds();
    console.log(`📊 Total ads in system: ${ads.length}`);
    
    // Display ads summary
    ads.forEach(ad => {
      console.log(`- ${ad.title} (${ad.placement}) - Status: ${ad.status}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize ads:', error);
  }
}

initializeAds();
