#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Google Site Verification CLI Utility
 * A simple CLI tool for managing Google Site Verification files and meta tags
 */

const commands = {
  help: () => {
    console.log(`
Google Site Verification CLI Utility

Usage: node scripts/google-site-verification.js <command> [options]

Commands:
  help                          Show this help message
  create-file <verification-code>   Create HTML verification file
  add-meta <verification-code>     Add meta tag to Next.js layout
  remove-file <verification-code>  Remove HTML verification file
  remove-meta                      Remove meta tag from Next.js layout
  list                             List existing verification files
  verify <verification-code>       Test if verification file is accessible

Examples:
  node scripts/google-site-verification.js create-file google752fde14da6956fc
  node scripts/google-site-verification.js add-meta google752fde14da6956fc
  node scripts/google-site-verification.js verify google752fde14da6956fc
`);
  },

  'create-file': (code) => {
    if (!code) {
      console.error('Error: Verification code is required');
      console.log('Usage: create-file <verification-code>');
      return;
    }

    const filename = `google${code}.html`;
    const filepath = path.join(process.cwd(), 'public', filename);
    const content = `google-site-verification: ${filename}`;

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    try {
      fs.writeFileSync(filepath, content);
      console.log(`✓ Created verification file: public/${filename}`);
      console.log(`✓ File content: ${content}`);
      console.log(`✓ File will be accessible at: https://your-domain.com/${filename}`);
    } catch (error) {
      console.error('Error creating verification file:', error.message);
    }
  },

  'add-meta': (code) => {
    if (!code) {
      console.error('Error: Verification code is required');
      console.log('Usage: add-meta <verification-code>');
      return;
    }

    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    
    try {
      let content = fs.readFileSync(layoutPath, 'utf8');
      const metaTag = `  <meta name="google-site-verification" content="${code}" />`;
      
      // Check if meta tag already exists
      if (content.includes('google-site-verification')) {
        console.log('⚠ Google site verification meta tag already exists in layout.tsx');
        return;
      }

      // Add meta tag to the <head> section
      if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>\n${metaTag}`);
      } else {
        console.error('Error: Could not find <head> tag in layout.tsx');
        return;
      }

      fs.writeFileSync(layoutPath, content);
      console.log('✓ Added Google site verification meta tag to src/app/layout.tsx');
      console.log(`✓ Meta tag: ${metaTag.trim()}`);
    } catch (error) {
      console.error('Error adding meta tag:', error.message);
    }
  },

  'remove-file': (code) => {
    if (!code) {
      console.error('Error: Verification code is required');
      console.log('Usage: remove-file <verification-code>');
      return;
    }

    const filename = `google${code}.html`;
    const filepath = path.join(process.cwd(), 'public', filename);

    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`✓ Removed verification file: public/${filename}`);
      } else {
        console.log(`⚠ Verification file not found: public/${filename}`);
      }
    } catch (error) {
      console.error('Error removing verification file:', error.message);
    }
  },

  'remove-meta': () => {
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    
    try {
      let content = fs.readFileSync(layoutPath, 'utf8');
      
      // Remove google-site-verification meta tag
      const metaRegex = /\s*<meta name="google-site-verification"[^>]*>\s*/g;
      const originalContent = content;
      content = content.replace(metaRegex, '');

      if (content !== originalContent) {
        fs.writeFileSync(layoutPath, content);
        console.log('✓ Removed Google site verification meta tag from src/app/layout.tsx');
      } else {
        console.log('⚠ No Google site verification meta tag found in layout.tsx');
      }
    } catch (error) {
      console.error('Error removing meta tag:', error.message);
    }
  },

  'list': () => {
    const publicDir = path.join(process.cwd(), 'public');
    
    try {
      if (!fs.existsSync(publicDir)) {
        console.log('No public directory found');
        return;
      }

      const files = fs.readdirSync(publicDir);
      const verificationFiles = files.filter(file => file.startsWith('google') && file.endsWith('.html'));
      
      if (verificationFiles.length === 0) {
        console.log('No Google verification files found in public directory');
      } else {
        console.log('Found Google verification files:');
        verificationFiles.forEach(file => {
          const filepath = path.join(publicDir, file);
          const content = fs.readFileSync(filepath, 'utf8');
          console.log(`  - ${file} (${content})`);
        });
      }
    } catch (error) {
      console.error('Error listing verification files:', error.message);
    }
  },

  'verify': (code) => {
    if (!code) {
      console.error('Error: Verification code is required');
      console.log('Usage: verify <verification-code>');
      return;
    }

    const filename = `google${code}.html`;
    const filepath = path.join(process.cwd(), 'public', filename);

    try {
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        console.log(`✓ Verification file exists: public/${filename}`);
        console.log(`✓ Content: ${content}`);
        console.log(`✓ File should be accessible at: https://your-domain.com/${filename}`);
      } else {
        console.log(`✗ Verification file not found: public/${filename}`);
        console.log('Run: create-file <verification-code> to create it');
      }
    } catch (error) {
      console.error('Error verifying file:', error.message);
    }
  }
};

// Parse command line arguments
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  commands.help();
  process.exit(1);
}

// Execute the command
commands[command](...args);
