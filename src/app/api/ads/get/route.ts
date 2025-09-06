import { NextRequest, NextResponse } from 'next/server';
import { adManager } from '@/lib/ad-manager';
import { AdRequest } from '@/types/advertising';

export async function POST(request: NextRequest) {
  try {
    const body: AdRequest = await request.json();
    
    // Validate required fields
    if (!body.placement || !body.userContext || !body.slotInfo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get ad from ad manager
    const adResponse = await adManager.getAd(body);

    if (!adResponse) {
      return NextResponse.json(
        { success: true, ad: null, message: 'No ads available for this request' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      ad: adResponse
    });

  } catch (error) {
    console.error('Error serving ad:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve ad' },
      { status: 500 }
    );
  }
}
