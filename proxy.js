/**
 * Vercel Serverless Function — DashScope CORS Proxy
 * /api/proxy?url=https://dashscope-intl.aliyuncs.com/...
 */

const https = require('https');
const http = require('http');
const url = require('url');

const ALLOWED_HOSTS = [
  'dashscope-intl.aliyuncs.com',
  'dashscope.aliyuncs.com'
];

// Disable Vercel's automatic body parsing agar kita bisa stream raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-DashScope-Async, X-DashScope-Plugin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const parsedReqUrl = url.parse(req.url, true);
  const targetUrl = parsedReqUrl.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  const parsed = url.parse(targetUrl);
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.status(403).json({ error: 'Forbidden host: ' + parsed.hostname });
    return;
  }

  const apiKey = process.env.DASHSCOPE_API_KEY || '';
  const clientAuth = req.headers['authorization'] || '';
  const authHeader = apiKey ? `Bearer ${apiKey}` : clientAuth;

  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.path,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': authHeader,
      'User-Agent': 'QwenStudio-Vercel/1.0',
    }
  };

  if (req.headers['x-dashscope-async'])
    options.headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
  if (req.headers['x-dashscope-plugin'])
    options.headers['X-DashScope-Plugin'] = req.headers['x-dashscope-plugin'];

  // Kumpulkan raw request body
  const rawBody = await new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });

  return new Promise((resolve) => {
    const transport = parsed.protocol === 'https:' ? https : http;

    const proxyReq = transport.request(options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || 'application/json';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(proxyRes.statusCode);

      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        res.end(Buffer.concat(chunks));
        resolve();
      });
      proxyRes.on('error', () => {
        res.status(502).json({ error: 'Upstream read error' });
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(502).json({ error: 'Proxy error: ' + e.message });
      resolve();
    });

    if (rawBody.length > 0) {
      proxyReq.write(rawBody);
    }
    proxyReq.end();
  });
};
