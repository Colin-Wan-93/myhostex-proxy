import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT) || 3000;
const HOSTEX_TOKEN = process.env.HOSTEX_TOKEN;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'https://colin-wan-93.github.io';
const TARGET = 'https://api.myhostex.com';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ALLOW_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Hostex-Access-Token'],
    credentials: false,
  })
);

app.all('/hostex/*', async (req, res) => {
  try {
    const path = req.path.replace(/^\/hostex/, '');
    const url = new URL(path, TARGET);

    for (const [k, v] of Object.entries(req.query)) {
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item);
      } else {
        url.searchParams.set(k, v);
      }
    }

    const fetchInit = {
      method: req.method,
      headers: {
        accept: 'application/json',
        'Hostex-Access-Token': HOSTEX_TOKEN,
      },
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      fetchInit.headers['content-type'] = 'application/json';
      fetchInit.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url.toString(), fetchInit);

    let data = null;
    const text = await upstream.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});