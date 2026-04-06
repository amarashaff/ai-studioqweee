/**
 * Vercel Serverless Function — DashScope CORS Proxy
 * Menggantikan proxy-server.js untuk deployment di Vercel
 *
 * Endpoint: /api/proxy?url=https://dashscope-intl.aliyuncs.com/...
 * API key diambil dari environment variable DASHSCOPE_API_KEY
 */

const https = require('https');
const http = require('http');
const url = require('url');

const ALLOWED_HOSTS = [
  'dashscope-intl.aliyuncs.com',
  'dashscope.aliyuncs.com'
];

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-DashScope-Async, X-DashScope-Plugin');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  // Security: only allow DashScope hosts
  const parsed = url.parse(targetUrl);
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.status(403).json({ error: 'Forbidden host: ' + parsed.hostname });
    return;
  }

  // Get API key from environment variable, fallback ke header dari client
  const apiKey = process.env.DASHSCOPE_API_KEY || '';
  const clientAuth = req.headers['authorization'] || '';
  const authHeader = apiKey ? `Bearer ${apiKey}` : clientAuth;

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.path,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': authHeader,
      'User-Agent': 'QwenStudio-Vercel/1.0',
    }
  };

  // Forward DashScope-specific headers
  if (req.headers['x-dashscope-async'])
    options.headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
  if (req.headers['x-dashscope-plugin'])
    options.headers['X-DashScope-Plugin'] = req.headers['x-dashscope-plugin'];

  const transport = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const proxyReq = transport.request(options, (proxyRes) => {
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
      res.status(proxyRes.statusCode);

      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        res.end(body);
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(502).json({ error: 'Proxy error: ' + e.message });
      resolve();
    });

    // Stream request body
    if (req.method === 'POST' || req.method === 'PUT') {
      let reqBody = '';
      req.on('data', chunk => reqBody += chunk);
      req.on('end', () => {
        proxyReq.write(reqBody);
        proxyReq.end();
      });
    } else {
      proxyReq.end();
    }
  });
};
