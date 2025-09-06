import { NextRequest, NextResponse } from 'next/server';
import { adManager } from '@/lib/ad-manager';
import { Advertisement, AdType, AdPlacement, AdStatus } from '@/types/advertising';

// Get all ads or specific ad
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('id');

    if (adId) {
      const ads = adManager.getAds();
      const ad = ads.find(a => a.id === adId);
      
      if (!ad) {
        return NextResponse.json(
          { success: false, error: 'Ad not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, ad });
    }

    const ads = adManager.getAds();
    return NextResponse.json({ success: true, ads });

  } catch (error) {
    console.error('Error getting ads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get ads' },
      { status: 500 }
    );
  }
}

// Create new ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'title', 'content', 'targetUrl', 'advertiser', 'campaign', 'targeting', 'placement', 'pricing'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const newAd: Advertisement = {
      id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: body.type as AdType,
      title: body.title,
      content: body.content,
      imageUrl: body.imageUrl,
      videoUrl: body.videoUrl,
      targetUrl: body.targetUrl,
      advertiser: body.advertiser,
      campaign: {
        ...body.campaign,
        spentAmount: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: new Date(body.campaign.startDate),
        endDate: new Date(body.campaign.endDate)
      },
      targeting: body.targeting,
      placement: body.placement as AdPlacement,
      pricing: body.pricing,
      status: body.status as AdStatus || AdStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate)
    };

    await adManager.addAd(newAd);

    return NextResponse.json({ success: true, ad: newAd });

  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ad' },
      { status: 500 }
    );
  }
}

// Update ad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if present
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.campaign?.startDate) updates.campaign.startDate = new Date(updates.campaign.startDate);
    if (updates.campaign?.endDate) updates.campaign.endDate = new Date(updates.campaign.endDate);

    const success = await adManager.updateAd(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// Delete ad
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('id');
    
    if (!adId) {
      return NextResponse.json(
        { success: false, error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    const success = await adManager.deleteAd(adId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
