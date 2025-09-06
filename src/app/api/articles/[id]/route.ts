import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Article } from '@/lib/news-collector';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params;
    
    // Читаем данные из файла articles.json
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'articles.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Articles file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const articles: Article[] = JSON.parse(fileContent);
    
    // Найти статью по ID
    const article = articles.find(a => a.id === id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article
    });
    
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
