import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { ApiKeyManager } from '@/lib/api-manager';
import { Article } from '@/lib/news-collector';
import { ApiResponse } from '@/types/api';
import crypto from 'crypto';

const apiManager = new ApiKeyManager();

// Middleware d'authentification et de rate limiting
async function authenticateRequest(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return {
      error: NextResponse.json({
        success: false,
        error: 'API key manquante',
        message: 'Veuillez fournir votre API key dans le header X-API-Key ou Authorization'
      }, { status: 401 }),
      startTime,
      requestId
    };
  }

  const validation = apiManager.validateApiKey(apiKey);
  if (!validation.isValid) {
    return {
      error: NextResponse.json({
        success: false,
        error: 'API key invalide',
        message: validation.error
      }, { status: 401 }),
      startTime,
      requestId
    };
  }

  const rateLimit = apiManager.checkRateLimit(validation.apiKey!);
  if (!rateLimit.allowed) {
    return {
      error: NextResponse.json({
        success: false,
        error: 'Rate limit dépassé',
        message: rateLimit.error,
        metadata: {
          rateLimit: rateLimit.rateLimitStatus,
          timestamp: new Date().toISOString(),
          requestId
        }
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.rateLimitStatus.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.rateLimitStatus.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.rateLimitStatus.resetTime,
          'Retry-After': '60'
        }
      }),
      startTime,
      requestId
    };
  }

  return {
    apiKey: validation.apiKey!,
    rateLimitStatus: rateLimit.rateLimitStatus,
    startTime,
    requestId
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth.error) {
    return auth.error;
  }

  const { apiKey, rateLimitStatus, startTime, requestId } = auth as any;

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const source = url.searchParams.get('source');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 1000);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const search = url.searchParams.get('search');
    const sentiment = url.searchParams.get('sentiment');

    // Vérifier les permissions
    const permissionCheck = apiManager.checkPermissions(apiKey, 'articles', 'read', {
      limit,
      category,
      source
    });

    if (!permissionCheck.hasPermission) {
      const response = NextResponse.json({
        success: false,
        error: 'Permission refusée',
        message: permissionCheck.error
      }, { status: 403 });

      // Logger l'usage même en cas d'erreur
      apiManager.logUsage(
        apiKey,
        '/api/v1/articles',
        'GET',
        performance.now() - startTime,
        403,
        JSON.stringify(request.url).length,
        JSON.stringify(response).length,
        request.headers.get('User-Agent') || undefined,
        request.headers.get('X-Forwarded-For') || undefined
      );

      return response;
    }

    // Lire les articles
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await readFile(articlesPath, 'utf-8');
    const allArticles: Article[] = JSON.parse(articlesData);

    // Appliquer les filtres
    let filteredArticles = allArticles;

    if (category) {
      filteredArticles = filteredArticles.filter(article => 
        article.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (source) {
      filteredArticles = filteredArticles.filter(article => 
        article.source.toLowerCase().includes(source.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (sentiment) {
      filteredArticles = filteredArticles.filter(article => 
        article.sentiment === sentiment
      );
    }

    // Pagination
    const total = filteredArticles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);

    const response: ApiResponse = {
      success: true,
      data: {
        articles: paginatedArticles,
        total
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId,
        processingTime,
        rateLimit: rateLimitStatus
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: endIndex < total
      }
    };

    const responseJson = NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': rateLimitStatus.resetTime,
        'X-Request-ID': requestId
      }
    });

    // Logger l'usage
    apiManager.logUsage(
      apiKey,
      '/api/v1/articles',
      'GET',
      processingTime,
      200,
      JSON.stringify(request.url).length,
      JSON.stringify(response).length,
      request.headers.get('User-Agent') || undefined,
      request.headers.get('X-Forwarded-For') || undefined
    );

    return responseJson;

  } catch (error) {
    console.error('Erreur API v1 articles:', error);
    
    const errorResponse = {
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Une erreur est survenue lors du traitement de votre demande',
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId,
        rateLimit: rateLimitStatus
      }
    };

    // Logger l'erreur
    apiManager.logUsage(
      apiKey,
      '/api/v1/articles',
      'GET',
      performance.now() - startTime,
      500,
      JSON.stringify(request.url).length,
      JSON.stringify(errorResponse).length,
      request.headers.get('User-Agent') || undefined,
      request.headers.get('X-Forwarded-For') || undefined
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
