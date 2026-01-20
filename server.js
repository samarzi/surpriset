import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ALLOWED_HOSTS = [
  'card.wb.ru',
  'www.wildberries.ru',
  'ozon.ru',
  'market.yandex.ru'
];

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).json({ error: 'url required' });
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    const hostname = new URL(decodedUrl).hostname;

    if (!ALLOWED_HOSTS.some((h) => hostname.includes(h))) {
      return res.status(403).json({ error: 'host not allowed' });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://www.wildberries.ru/'
      }
    });

    const contentType = response.headers.get('content-type');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType || 'application/json');

    const data = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(data || JSON.stringify({ error: `upstream HTTP ${response.status}` }));
    }

    return res.status(200).send(data);
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).json({ error: e?.message || 'proxy failed' });
  }
});

// Serve built frontend
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
