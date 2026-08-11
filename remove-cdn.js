const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let html = fs.readFileSync(filePath, 'utf-8');
  const original = html;

  // Remove Tailwind CDN script (render-blocking external script)
  html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser[^"]*"[^>]*><\/script>\s*/g, '');

  // Remove Lucide CDN script
  html = html.replace(/<script src="https:\/\/unpkg\.com\/lucide[^"]*"[^>]*><\/script>\s*/g, '');

  // Convert <style type="text/tailwindcss"> to <style> so browser processes it natively (without Tailwind processing,
  // only plain CSS inside will work - which is fine since most styles are inline)
  html = html.replace(/<style type="text\/tailwindcss">/g, '<style>');

  // Add lucide icon fallback - replace data-lucide elements with text/emoji before scripts run
  const lucideFallback = `<script>
// Fallback: if lucide doesn't load, show emoji/text placeholders
window.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    document.querySelectorAll('[data-lucide]').forEach(function(el){
      if(el.tagName==='I' || el.children.length===0){
        var icon = el.getAttribute('data-lucide');
        var map = {home:'🏠',layout:'📊',users:'👥',settings:'⚙️',search:'🔍',plus:'＋',
          bell:'🔔',user:'👤',logOut:'🚪',chevronDown:'▾',chevronRight:'▸',x:'×',
          filter:'🔽',download:'⬇',upload:'⬆',edit:'✏️',trash:'🗑',eye:'👁',
          package:'📦',truck:'🚛',ship:'🚢',plane:'✈️',fileText:'📄',check:'✓',
          alert:'⚠',clock:'🕐',mapPin:'📍',dollar:'💰',trendingUp:'📈',barChart2:'📊',
          arrowRight:'→',menu:'☰',refresh:'🔄'};
        if(!el.innerHTML.trim()) el.textContent = map[icon] || '•';
      }
    });
    if(window.lucide && lucide.createIcons) { try{ lucide.createIcons(); }catch(e){} }
  },100);
});
</script>`;

  // Insert fallback script before </body>
  if (html.indexOf('lucideFallback') === -1) {
    html = html.replace('</body>', lucideFallback + '\n</body>');
  }

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nDone. Fixed ${totalFixed} files.`);
