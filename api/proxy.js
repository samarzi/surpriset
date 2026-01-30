// Прокси для API запросов (для обхода CORS в продакшене)
// Используется как middleware в Express сервере

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:5001';

function proxyApiRequest(req, res) {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }

  // Формируем URL для Python API
  const apiUrl = `${API_SERVER_URL}/api/parse?url=${encodeURIComponent(targetUrl)}`;
  
  const url = new URL(apiUrl);
  const client = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SurpriSet-Proxy/1.0'
    }
  };

  const proxyReq = client.request(options, (proxyRes) => {
    let data = '';
    
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.status(proxyRes.statusCode).json(jsonData);
      } catch (e) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse API response'
        });
      }
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: `Proxy error: ${error.message}`
    });
  });

  proxyReq.end();
}

module.exports = { proxyApiRequest };
