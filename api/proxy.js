import fetch from "node-fetch";

const ALLOWED_HOSTS = [
  "card.wb.ru",
  "www.wildberries.ru",
  "ozon.ru",
  "market.yandex.ru"
];

export default async function handler(req, res) {
  try {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).json({ error: "url required" });
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    const hostname = new URL(decodedUrl).hostname;

    if (!ALLOWED_HOSTS.some(h => hostname.includes(h))) {
      return res.status(403).json({ error: "host not allowed" });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "ru-RU,ru;q=0.9",
        "Referer": "https://www.wildberries.ru/"
      }
    });

    const contentType = response.headers.get("content-type");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType || "application/json");

    const data = await response.text();
    res.status(200).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
