/**
 * QWEN AI Studio — Proxy Server
 * Mengatasi CORS saat akses DashScope API dari browser
 *
 * CARA PAKAI:
 *   1. Pastikan Node.js sudah terinstall (node -v)
 *   2. Jalankan: node proxy-server.js
 *   3. Buka browser: http://localhost:3456
 *   4. File ai-studio.html akan otomatis ter-serve + semua API di-relay
 *
 * Tidak perlu install package tambahan — menggunakan built-in Node.js http/https
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3456;
const DASHSCOPE_HOSTS = [
  'dashscope-intl.aliyuncs.com',
  'dashscope.aliyuncs.com'
];

// ─── MIME TYPES ───────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json'
};

// ─── CORS HEADERS ─────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-DashScope-Async, X-DashScope-Plugin');
}

// ─── PROXY REQUEST ────────────────────────────────────────────
function proxyRequest(req, res, targetUrl) {
  const parsed = url.parse(targetUrl);
  const isHttps = parsed.protocol === 'https:';

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.path,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': req.headers['authorization'] || '',
      'User-Agent': 'QwenStudio-Proxy/1.0',
    }
  };

  // Forward DashScope-specific headers
  if (req.headers['x-dashscope-async'])
    options.headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
  if (req.headers['x-dashscope-plugin'])
    options.headers['X-DashScope-Plugin'] = req.headers['x-dashscope-plugin'];

  const transport = isHttps ? https : http;
  const proxyReq = transport.request(options, (proxyRes) => {
    setCORS(res);
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy error:', e.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }));
  });

  // Stream request body
  req.pipe(proxyReq);
}

// ─── SERVER ───────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Preflight
  if (req.method === 'OPTIONS') {
    setCORS(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy route: /proxy?url=https://dashscope-intl.aliyuncs.com/...
  if (pathname === '/proxy') {
    const targetUrl = parsedUrl.query.url;
    if (!targetUrl) {
      res.writeHead(400);
      res.end('Missing url param');
      return;
    }
    // Security: only allow DashScope hosts
    const targetHost = url.parse(targetUrl).hostname;
    if (!DASHSCOPE_HOSTS.some(h => targetHost === h)) {
      res.writeHead(403);
      res.end('Forbidden host: ' + targetHost);
      return;
    }
    console.log(`[PROXY] ${req.method} ${targetUrl.split('?')[0]}`);
    proxyRequest(req, res, targetUrl);
    return;
  }

  // Serve ai-studio.html at root
  let filePath = pathname === '/' ? '/ai-studio.html' : pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + pathname);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║     QWEN AI Studio — Proxy Ready     ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Buka browser: http://localhost:${PORT}  ║`);
  console.log('║  Tekan Ctrl+C untuk berhenti          ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
});
