import { NextRequest, NextResponse } from 'next/server';
import KVService from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    switch (action) {
      case 'health':
        const isHealthy = await KVService.healthCheck();
        return NextResponse.json({ 
          success: true, 
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const stats = await KVService.getStats();
        return NextResponse.json({ 
          success: true, 
          data: stats 
        });

      case 'get':
        if (!key) {
          return NextResponse.json({ 
            success: false, 
            error: 'Key parameter is required for get action' 
          }, { status: 400 });
        }
        
        const value = await KVService.get(key);
        return NextResponse.json({ 
          success: true, 
          data: { key, value } 
        });

      case 'keys':
        const pattern = searchParams.get('pattern') || '*';
        const keys = await KVService.getKeys(pattern);
        return NextResponse.json({ 
          success: true, 
          data: { pattern, keys } 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Supported actions: health, stats, get, keys' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('KV API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, value, ttl } = body;

    switch (action) {
      case 'set':
        if (!key || value === undefined) {
          return NextResponse.json({ 
            success: false, 
            error: 'Key and value are required for set action' 
          }, { status: 400 });
        }
        
        await KVService.set(key, value, ttl);
        return NextResponse.json({ 
          success: true, 
          data: { key, set: true } 
        });

      case 'delete':
        if (!key) {
          return NextResponse.json({ 
            success: false, 
            error: 'Key parameter is required for delete action' 
          }, { status: 400 });
        }
        
        await KVService.delete(key);
        return NextResponse.json({ 
          success: true, 
          data: { key, deleted: true } 
        });

      case 'clear-translations':
        await KVService.clearTranslationCache();
        return NextResponse.json({ 
          success: true, 
          data: { cleared: true } 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Supported actions: set, delete, clear-translations' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('KV API POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    const isHealthy = await KVService.healthCheck();
    if (isHealthy) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
