const https = require('https');

const URL = 'https://tmsrdgn-aug8.loca.lt/dashboard.html';

function ping() {
  const req = https.get(URL, { headers: { 'bypass-tunnel-reminder': '1' } }, (res) => {
    res.resume();
    console.log('[Ping] ' + new Date().toLocaleTimeString() + ' status ' + res.statusCode);
  });
  req.on('error', (err) => {
    console.log('[Ping] ' + new Date().toLocaleTimeString() + ' error: ' + err.message);
  });
  req.setTimeout(15000, () => req.abort());
}

ping();
setInterval(ping, 30000);
