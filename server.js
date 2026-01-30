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

// Прокси для Python API парсера
app.get('/api/parse', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required. Please provide a valid marketplace URL.'
      });
    }

    // Проксируем запрос к Python API серверу
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
    const apiUrl = `${pythonApiUrl}/api/parse?url=${encodeURIComponent(targetUrl)}`;
    
    console.log(`📤 Proxying request to Python API: ${apiUrl}`);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SurpriSet-Proxy/1.0'
        },
        timeout: 60000 // 60 секунд для Playwright
      });
    } catch (fetchError) {
      console.error('❌ Failed to connect to Python API:', fetchError);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(503).json({
        success: false,
        error: `Не удалось подключиться к Python API серверу на ${pythonApiUrl}. Убедитесь, что сервер запущен.`
      });
    }

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при обработке ответа от Python API'
      });
    }
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    return res.status(200).json(data);
  } catch (e) {
    console.error('Python API proxy error:', e);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(500).json({
      success: false,
      error: `Proxy error: ${e?.message || 'Failed to connect to Python API'}`
    });
  }
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

// SPA fallback - только для не-API маршрутов
app.get('*', (req, res) => {
  // Не обрабатываем API маршруты через SPA fallback
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
