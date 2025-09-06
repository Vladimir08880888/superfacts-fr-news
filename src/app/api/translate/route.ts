import { NextRequest, NextResponse } from 'next/server';

interface TranslationRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

interface TranslationResponse {
  translatedText: string;
  detectedSourceLang?: string;
  error?: string;
}

// Simple translation service using Google Translate via free API
async function translateWithGoogle(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  try {
    // Using Google Translate's free web API (note: this may have limitations)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: [string, string]) => item[0]).join('');
    }
    
    throw new Error('Invalid translation response format');
  } catch (error) {
    console.error('Google Translate error:', error);
    throw error;
  }
}

// Fallback simple translation service (mock implementation)
async function fallbackTranslate(text: string, targetLang: string): Promise<string> {
  // This is a very basic fallback - in production, you might want to use another service
  // or implement a more sophisticated fallback mechanism
  
  // Common phrases translation map
  const translations: { [key: string]: { [lang: string]: string } } = {
    // Common UI elements
    'Actualités françaises en temps réel': {
      'en': 'French news in real time',
      'es': 'Noticias francesas en tiempo real',
      'de': 'Französische Nachrichten in Echtzeit',
      'it': 'Notizie francesi in tempo reale',
      'pt': 'Notícias francesas em tempo real',
      'ru': 'Французские новости в реальном времени',
      'zh': '实时法国新闻',
      'ja': 'リアルタイムのフランスニュース',
      'ko': '실시간 프랑스 뉴스',
      'ar': 'الأخبار الفرنسية في الوقت الفعلي',
      'hi': 'रीयल टाइम में फ्रांसीसी समाचार'
    },
    'Toutes les actualités': {
      'en': 'All news',
      'es': 'Todas las noticias',
      'de': 'Alle Nachrichten',
      'it': 'Tutte le notizie',
      'pt': 'Todas as notícias',
      'ru': 'Все новости',
      'zh': '所有新闻',
      'ja': 'すべてのニュース',
      'ko': '모든 뉴스',
      'ar': 'جميع الأخبار',
      'hi': 'सभी समाचार'
    },
    'À la Une': {
      'en': 'Top Stories',
      'es': 'Portada',
      'de': 'Schlagzeilen',
      'it': 'In prima pagina',
      'pt': 'Manchetes',
      'ru': 'Главные новости',
      'zh': '头条新闻',
      'ja': 'トップニュース',
      'ko': '주요 뉴스',
      'ar': 'العناوين الرئيسية',
      'hi': 'मुख्य समाचार'
    },
    'Lire l\'article': {
      'en': 'Read article',
      'es': 'Leer artículo',
      'de': 'Artikel lesen',
      'it': 'Leggi articolo',
      'pt': 'Ler artigo',
      'ru': 'Читать статью',
      'zh': '阅读文章',
      'ja': '記事を読む',
      'ko': '기사 읽기',
      'ar': 'قراءة المقال',
      'hi': 'लेख पढ़ें'
    }
  };

  const lowerText = text.toLowerCase().trim();
  for (const [key, langMap] of Object.entries(translations)) {
    if (key.toLowerCase() === lowerText && langMap[targetLang]) {
      return langMap[targetLang];
    }
  }

  // If no translation found, return original text
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, targetLang, sourceLang = 'fr' } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // Validate target language
    const supportedLangs = ['en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'fr'];
    if (!supportedLangs.includes(targetLang)) {
      return NextResponse.json(
        { error: 'Unsupported target language' },
        { status: 400 }
      );
    }

    // If target is same as source, return original text
    if (targetLang === sourceLang) {
      return NextResponse.json({ translatedText: text });
    }

    let translatedText: string;
    
    try {
      // Try Google Translate first
      translatedText = await translateWithGoogle(text, targetLang, sourceLang);
    } catch (error) {
      console.warn('Google Translate failed, using fallback:', error);
      // Use fallback translation
      translatedText = await fallbackTranslate(text, targetLang);
    }

    const response: TranslationResponse = {
      translatedText,
      detectedSourceLang: sourceLang
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during translation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Translation API endpoint',
      supportedLanguages: [
        'fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'
      ],
      usage: 'POST /api/translate with { text, targetLang, sourceLang? }'
    }
  );
}
