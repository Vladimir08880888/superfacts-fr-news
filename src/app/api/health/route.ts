import { NextResponse } from 'next/server';
import { existsSync, statSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Проверяем возможность записи в директорию data
    const dataDir = path.join(process.cwd(), 'data');
    const articlesPath = path.join(dataDir, 'articles.json');
    
    let status = 'healthy';
    let checks = {
      filesystem: false,
      dataDirectory: false,
      articlesFile: false as boolean | { exists: boolean; size: number; modified: Date }
    };

    // Проверяем файловую систему
    try {
      const testPath = path.join(process.cwd(), 'test-write');
      require('fs').writeFileSync(testPath, 'test');
      require('fs').unlinkSync(testPath);
      checks.filesystem = true;
    } catch (error) {
      checks.filesystem = false;
      status = 'limited'; // Ограниченная функциональность без записи
    }

    // Проверяем директорию данных
    if (existsSync(dataDir)) {
      checks.dataDirectory = true;
      
      // Проверяем файл статей
      if (existsSync(articlesPath)) {
        const stats = statSync(articlesPath);
        checks.articlesFile = {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        };
      }
    }

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      platform: process.env.VERCEL ? 'vercel' : process.env.RAILWAY_ENVIRONMENT ? 'railway' : process.env.RENDER ? 'render' : 'standard',
      checks,
      environment: process.env.NODE_ENV,
      message: status === 'limited' ? 'Running in serverless mode - file operations disabled' : 'All systems operational'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Убираем edge runtime для доступа к файловой системе
