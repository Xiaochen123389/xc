const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let html = fs.readFileSync(filePath, 'utf-8');
  const original = html;

  // Remove @theme inline block (Tailwind v4 specific)
  html = html.replace(/<style>\s*@theme inline\s*\{[\s\S]*?\}\s*@layer base\s*\{[\s\S]*?\}\s*<\/style>/g, '<style>td,th{word-break:break-all;word-break:auto-phrase;}th{white-space:nowrap;}body{background:var(--tms-bg);color:var(--tms-foreground);}</style>');

  // Remove empty/leftover @theme/@layer blocks if any remain
  html = html.replace(/@theme inline\s*\{[\s\S]*?\}\s*/g, '');
  html = html.replace(/@layer base\s*\{[\s\S]*?\}\s*/g, '');

  // Replace @apply directives with inline equivalents
  html = html.replace(/@apply\s+([^;{}]+);/g, function(match, classes) {
    // Convert simple @apply to CSS properties
    var map = {
      'break-words': 'word-break:break-all;word-break:auto-phrase;',
      'whitespace-nowrap': 'white-space:nowrap;',
    };
    var result = '';
    classes.split(/\s+/).forEach(function(cls) {
      if (map[cls]) result += map[cls];
    });
    return result || '/* removed @apply */';
  });

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`Cleaned: ${file}`);
    totalFixed++;
  }
});

console.log(`\nDone. Cleaned ${totalFixed} files.`);
