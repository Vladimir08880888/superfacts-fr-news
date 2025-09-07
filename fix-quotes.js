#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Исправляем двойное экранирование кавычек
    content = content.replace(/\\\\'/g, "\\'");
    
    // Дополнительные исправления для конкретных паттернов
    content = content.replace(/d\\\\/g, "d'");
    content = content.replace(/l\\\\/g, "l'");
    content = content.replace(/n\\\\/g, "n'");
    content = content.replace(/s\\\\/g, "s'");
    content = content.replace(/t\\\\/g, "t'");
    content = content.replace(/m\\\\/g, "m'");
    content = content.replace(/c\\\\/g, "c'");
    content = content.replace(/r\\\\/g, "r'");
    content = content.replace(/p\\\\/g, "p'");
    content = content.replace(/v\\\\/g, "v'");
    content = content.replace(/f\\\\/g, "f'");
    content = content.replace(/g\\\\/g, "g'");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Найти все TS и TSX файлы
const files = glob.sync('./src/**/*.{ts,tsx}', { cwd: __dirname });

console.log(`Found ${files.length} TypeScript files`);

let fixedCount = 0;
files.forEach(file => {
  if (fixQuotesInFile(path.join(__dirname, file))) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
