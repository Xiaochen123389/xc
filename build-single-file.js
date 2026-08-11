/**
 * TMS Prototype - Single File Builder
 */
const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const pagesDir = path.join(projectDir, 'pages');
const appJsPath = path.join(projectDir, 'assets', 'app.js');
const outputPath = 'C:\\Users\\86182\\Desktop\\tms-prototype.html';

function processScriptCode(code) {
  // DOMContentLoaded -> __ready
  code = code.split('document.addEventListener("DOMContentLoaded",').join('__ready(');
  code = code.split("document.addEventListener('DOMContentLoaded',").join('__ready(');
  code = code.split('window.addEventListener("DOMContentLoaded",').join('__ready(');
  code = code.split("window.addEventListener('DOMContentLoaded',").join('__ready(');
  // Convert let/const to var to avoid redeclaration errors on page switch
  code = code.replace(/\blet /g, 'var ');
  code = code.replace(/\bconst /g, 'var ');
  // page navigation
  code = code.replace(/window\.location\.replace\(\s*["']([^"']+)\.html["']\s*\)/g, "__nav('$1')");
  code = code.replace(/window\.location\.href\s*=\s*["']([^"']+)\.html["']/g, "__nav('$1')");
  code = code.replace(/location\.href\s*=\s*["']([^"']+)\.html["']/g, "__nav('$1')");
  code = code.replace(/window\.location\s*=\s*["']([^"']+)\.html["']/g, "__nav('$1')");
  // Expose function declarations to window so inline onclick handlers can find them
  var __fnNames = [];
  code.replace(/\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(/g, function(m, n) {
    if (__fnNames.indexOf(n) === -1) __fnNames.push(n);
    return m;
  });
  if (__fnNames.length) {
    code += '\n;(function(){';
    for (var i = 0; i < __fnNames.length; i++) {
      code += 'try{window["' + __fnNames[i] + '"]=' + __fnNames[i] + ';}catch(e){}';
    }
    code += '})();';
  }
  return code;
}

function processHtmlContent(html) {
  // Convert href="xxx.html" to href="#xxx" (also handle ../xxx.html and ./xxx.html)
  html = html.replace(/href=["'](?:\.\.\/(?:pages\/)?|\.|)([^"'#\s?]+)\.html(?:\?[^"'\s]*)?["']/g, 'href="#$1"');
  // Inline JS navigation
  html = html.replace(/window\.location\.replace\(\s*["']([^"']+)\.html["']\s*\)/g, "__nav('$1')");
  html = html.replace(/window\.location\.href\s*=\s*["']([^"']+)\.html["']/g, "__nav('$1')");
  html = html.replace(/location\.href\s*=\s*["']([^"']+)\.html["']/g, "__nav('$1')");
  return html;
}

console.log('Reading app.js...');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Remove auth guard block in app.js (it checks paths like login.html)
const authGuardStart = appJs.indexOf('/* ========== 登录鉴权守卫');
const authGuardEnd = appJs.indexOf('})();', authGuardStart);
if (authGuardStart > -1 && authGuardEnd > -1) {
  appJs = appJs.substring(0, authGuardStart) + '/* auth guard removed for single-file mode */\n' + appJs.substring(authGuardEnd + 6);
}

appJs = processScriptCode(appJs);
// Fix toast null pointer: add null check for container
appJs = appJs.replace(
  "var c = document.getElementById('tms-toast-container');",
  "var c = document.getElementById('tms-toast-container'); if(!c) return;"
);
appJs = appJs.replace(/<\/script>/g, '<\\/script>');

console.log('Reading dept-sync.js...');
const deptSyncPath = path.join(projectDir, 'assets', 'js', 'dept-sync.js');
let deptSyncJs = '';
if (fs.existsSync(deptSyncPath)) {
  deptSyncJs = processScriptCode(fs.readFileSync(deptSyncPath, 'utf8'));
  deptSyncJs = deptSyncJs.replace(/<\/script>/g, '<\\/script>');
}

console.log('Reading pages...');
const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html')).sort();

const styles = [];
const pages = {};
const externalRefs = [];

for (const file of pageFiles) {
  const name = file.replace('.html', '');
  console.log('  Processing:', name);
  const html = fs.readFileSync(path.join(pagesDir, file), 'utf8');

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1] : name;

  // collect styles from whole html
  const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  for (const s of styleMatches) {
    const content = s.replace(/<style[^>]*>/, '').replace(/<\/style>/, '').trim();
    if (content) styles.push(content);
  }

  // body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let bodyContent = bodyMatch ? bodyMatch[1] : '';

  // extract inline scripts, skip external src
  const scripts = [];
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  let cleanHtml = '';
  let lastIdx = 0;
  while ((m = scriptRegex.exec(bodyContent)) !== null) {
    cleanHtml += bodyContent.slice(lastIdx, m.index);
    lastIdx = m.index + m[0].length;

    const fullTag = m[0];
    const srcMatch = fullTag.match(/\bsrc\s*=\s*["']([^"']+)["']/);
    if (srcMatch) {
      externalRefs.push({ page: name, src: srcMatch[1] });
    } else if (m[1].trim()) {
      scripts.push(processScriptCode(m[1]));
    }
  }
  cleanHtml += bodyContent.slice(lastIdx);

  // remove style tags (already collected)
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  // process links and inline navigation
  cleanHtml = processHtmlContent(cleanHtml);

  pages[name] = { html: cleanHtml.trim(), scripts: scripts, title: title };
}

if (externalRefs.length > 0) {
  console.log('\nExternal script references (only app.js inlined):');
  externalRefs.forEach(function(r) { console.log('  ' + r.page + ': ' + r.src); });
}

const allCss = styles.join('\n\n');
const pagesJson = JSON.stringify(pages)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const readyDef = [
  'var __ready = function(fn) {',
  '  if (document.readyState === "loading") {',
  '    document.addEventListener("DOMContentLoaded", fn);',
  '  } else { fn(); }',
  '};'
].join('\n');

const routerCode = [
  'var __PAGES = ' + pagesJson + ';',
  'var __currentPage = null;',
  '',
  'var __nav = function(pageName) {',
  '  if (!pageName) return;',
  '  pageName = String(pageName).replace(/\\.html$/, "");',
  '  if (location.hash !== "#" + pageName) {',
  '    location.hash = pageName;',
  '  } else {',
  '    __renderPage(pageName);',
  '  }',
  '};',
  '',
  'var __initPage = function() {',
  '  setTimeout(function() {',
  '    document.querySelectorAll("[data-count]").forEach(function(el) {',
  '      var v = parseInt(el.getAttribute("data-count") || "0", 10);',
  '      var prefix = el.getAttribute("data-prefix") || "";',
  '      var suffix = el.getAttribute("data-suffix") || "";',
  '      var isFloat = el.getAttribute("data-float") === "true";',
  '      if (window.animateNumber) animateNumber(el, v, 1200, prefix, suffix, isFloat);',
  '    });',
  '  }, 150);',
  '  document.querySelectorAll("input").forEach(function(inp) {',
  '    if (inp.__tmsEnterBound) return;',
  '    inp.__tmsEnterBound = true;',
  '    if (inp.form || inp.closest(".login-card")) {',
  '      inp.addEventListener("keydown", function(e) {',
  '        if (e.key === "Enter") {',
  '          var c = inp.closest("form,.login-card,.modal");',
  '          if (c) { var s = c.querySelector("button[type=submit],.btn-primary.login-btn"); if (s) s.click(); }',
  '        }',
  '      });',
  '    }',
  '  });',
  '};',
  '',
  'var __renderPage = function(pageName) {',
  '  var page = __PAGES[pageName];',
  '  if (!page) {',
  '    console.warn("Page not found:", pageName, "- redirecting to dashboard");',
  '    pageName = "dashboard";',
  '    page = __PAGES[pageName];',
  '    if (!page) { console.error("Dashboard not found!"); return; }',
  '  }',
  '  document.querySelectorAll(".modal-mask").forEach(function(m) { m.remove(); });',
  '  var tc = document.getElementById("tms-toast-container");',
  '  if (tc) tc.innerHTML = "";',
  '  document.body.style.overflow = "";',
  '  if (!document.getElementById("tms-toast-container")) {',
  '    var c = document.createElement("div");',
  '    c.id = "tms-toast-container";',
  '    c.className = "toast-container";',
  '    document.body.appendChild(c);',
  '  }',
  '  var root = document.getElementById("app-root");',
  '  root.innerHTML = page.html;',
  '  page.scripts.forEach(function(code) {',
  '    try {',
  '      var __s = document.createElement("script");',
  '      __s.textContent = code;',
  '      document.body.appendChild(__s);',
  '      __s.remove();',
  '    } catch(e) { console.error("Script error on page", pageName, ":", e.message); }',
  '  });',
  '  __currentPage = pageName;',
  '  window.scrollTo(0, 0);',
  '  if (page.title) document.title = page.title;',
  '  __initPage();',
  '};',
  '',
  'window.addEventListener("hashchange", function() {',
  '  var p = location.hash.slice(1);',
  '  if (p && __PAGES[p]) __renderPage(p);',
  '});',
  '',
  'if (!localStorage.getItem("tms_auth_token")) {',
  '  localStorage.setItem("tms_auth_token", "mock_" + Date.now());',
  '  localStorage.setItem("tms_user_name", "wb");',
  '  localStorage.setItem("tms_user_role", "主管");',
  '}',
  '',
  'var __initPageName = location.hash.slice(1);',
  'if (!__initPageName || !__PAGES[__initPageName]) __initPageName = "dashboard";',
  '__renderPage(__initPageName);'
].join('\n');

const output = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN" class="light">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<title>TMS供应链管理系统</title>',
  '<style>',
  allCss,
  '</style>',
  '</head>',
  '<body>',
  '<div id="app-root"></div>',
  '<script>',
  readyDef,
  appJs,
  '</script>',
  '<script>',
  deptSyncJs,
  '</script>',
  '<script>',
  routerCode,
  '</script>',
  '</body>',
  '</html>'
].join('\n');

try {
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log('\n========================================');
  console.log('Single file generated successfully!');
  console.log('Output: ' + outputPath);
  console.log('Pages: ' + Object.keys(pages).length);
  console.log('Size: ' + (output.length / 1024).toFixed(1) + ' KB');
  console.log('========================================');
} catch(e) {
  console.error('\nFailed to write to Desktop:', e.message);
  const fallback = path.join(projectDir, 'tms-prototype.html');
  fs.writeFileSync(fallback, output, 'utf8');
  console.log('Fallback output: ' + fallback);
}
