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

  let filePath = path.normalize(path.join(ROOT, url));
  // Security: ensure path is within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      // Try with .html extension
      if (!path.extname(filePath)) {
        const altPath = filePath + '.html';
        fs.stat(altPath, (err2, stat2) => {
          if (!err2 && stat2.isFile()) {
            serveFile(altPath, res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1><p>' + url + '</p>');
          }
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1><p>' + url + '</p>');
    }
    if (stat.isDirectory()) {
      // Try index.html in directory
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (err3, stat3) => {
        if (!err3 && stat3.isFile()) {
          serveFile(indexPath, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404 Not Found</h1>');
        }
      });
      return;
    }
    serveFile(filePath, res);
  });
});

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
