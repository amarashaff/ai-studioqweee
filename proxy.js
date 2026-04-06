const https = require('https');
const url = require('url');

const ALLOWED_HOSTS = [
  'dashscope-intl.aliyuncs.com',
  'dashscope.aliyuncs.com'
];

module.exports = async function handler(req, res) {
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

  // Kumpulkan raw request body
  const rawBody = await new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });

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

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
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

    if (rawBody.length > 0) proxyReq.write(rawBody);
    proxyReq.end();
  });
};
