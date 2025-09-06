import { NextRequest, NextResponse } from 'next/server';
import { adManager } from '@/lib/ad-manager';

export async function POST(request: NextRequest) {
  try {
    // Create sample ads for testing
    await adManager.createSampleAds();
    
    return NextResponse.json({
      success: true,
      message: 'Sample ads created successfully'
    });

  } catch (error) {
    console.error('Error creating sample ads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sample ads' },
      { status: 500 }
    );
  }
}
