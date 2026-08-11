const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  // CORS headers for tunnel compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let url = decodeURIComponent(req.url.split('?')[0]);
  // Root redirect to demo entry (auto-login then dashboard)
  if (url === '/' || url === '') url = '/pages/demo-entry.html';
  // Handle /pages/ -> demo entry
  if (url === '/pages/' || url === '/pages') url = '/pages/demo-entry.html';

  // Candidate paths: exact, .html fallback, pages/<url>, pages/<url>.html
  const candidates = [];
  const addCandidate = (p) => {
    const normalized = path.normalize(p);
    if (normalized.startsWith(ROOT) && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  addCandidate(path.join(ROOT, url));
  if (!path.extname(url)) addCandidate(path.join(ROOT, url + '.html'));
  if (!url.startsWith('/pages/') && !url.startsWith('/assets/')) {
    addCandidate(path.join(ROOT, 'pages', url));
    if (!path.extname(url)) addCandidate(path.join(ROOT, 'pages', url + '.html'));
  }

  tryServe(candidates, res, url);
});

function tryServe(candidates, res, url) {
  if (candidates.length === 0) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404 Not Found</h1><p>' + url + '</p>');
  }
  const filePath = candidates.shift();
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serveFile(filePath, res);
    } else if (!err && stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (err2, stat2) => {
        if (!err2 && stat2.isFile()) {
          serveFile(indexPath, res);
        } else {
          tryServe(candidates, res, url);
        }
      });
    } else {
      tryServe(candidates, res, url);
    }
  });
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
  fs.createReadStream(filePath).on('error', (e) => {
    res.writeHead(500);
    res.end('Internal Server Error');
  }).pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TMS Server] Running on http://localhost:${PORT}`);
  console.log(`[TMS Server] Root: ${ROOT}`);
});
