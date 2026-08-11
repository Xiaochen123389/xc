const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\86182\\Desktop\\tms-prototype.html', 'utf8');

// Find waybill-create scripts
var idx = html.indexOf('"waybill-create"');
var scriptsIdx = html.indexOf('"scripts"', idx);
var openBracket = html.indexOf('[', scriptsIdx);

// Find matching close bracket
var depth = 0;
var endBracket = -1;
for (var i = openBracket; i < html.length; i++) {
  if (html[i] === '[') depth++;
  if (html[i] === ']') { depth--; if (depth === 0) { endBracket = i; break; } }
}

var scriptsStr = html.substring(openBracket, endBracket + 1);
console.log('waybill-create scripts array length:', scriptsStr.length);

// Parse the JSON array to check script contents
try {
  var scripts = JSON.parse(scriptsStr);
  console.log('Number of scripts:', scripts.length);
  scripts.forEach(function(s, i) {
    console.log('\n--- Script', i, '(length:', s.length, ') ---');
    console.log('First 300 chars:', s.substring(0, 300));
    console.log('...');
    console.log('Contains goToStep:', s.indexOf('function goToStep') > -1 || s.indexOf('goToStep') > -1);
    console.log('Contains __ready:', s.indexOf('__ready') > -1);
    console.log('Contains DOMContentLoaded:', s.indexOf('DOMContentLoaded') > -1);
  });
} catch(e) {
  console.log('JSON parse error:', e.message);
  console.log('First 200 chars:', scriptsStr.substring(0, 200));
}
