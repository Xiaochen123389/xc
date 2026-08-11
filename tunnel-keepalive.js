const { spawn } = require('child_process');
const https = require('https');

const PORT = 8765;
const SUBDOMAIN = 'tmsrdgn-aug8';

let child = null;
let pingInterval = null;
let currentUrl = null;

function ping() {
  if (!currentUrl) return;
  const url = currentUrl + '/dashboard.html';
  const req = https.get(url, { headers: { 'bypass-tunnel-reminder': '1' } }, (res) => {
    res.resume();
  });
  req.on('error', () => {});
  req.setTimeout(10000, () => req.abort());
}

function startTunnel() {
  console.log('[Tunnel] 启动本地公网隧道，目标子域名：' + SUBDOMAIN);
  currentUrl = null;

  child = spawn('npx', [
    'localtunnel',
    '--port', String(PORT),
    '--subdomain', SUBDOMAIN
  ], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    const match = text.match(/your url is: (https:\/\/\S+)/);
    if (match) {
      currentUrl = match[1];
      if (!currentUrl.includes(SUBDOMAIN)) {
        console.log('[Tunnel] 未拿到固定子域名，5秒后重试...');
        child.kill();
      } else {
        console.log('[Tunnel] 外网地址已固定：' + currentUrl);
      }
    }
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  child.on('exit', (code) => {
    console.log('[Tunnel] 连接已断开，5秒后自动重连...');
    currentUrl = null;
    clearInterval(pingInterval);
    setTimeout(startTunnel, 5000);
  });

  clearInterval(pingInterval);
  pingInterval = setInterval(ping, 30000);
}

startTunnel();
