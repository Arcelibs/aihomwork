import { Hono } from 'hono';
import fs from 'fs';
import { lookup } from 'mime-types';
import { authMiddleware } from '../middleware/auth.js';
import { getRandomImage, getImagePath, getCategories } from '../services/imageService.js';
import type { ResponseFormat } from '../types.js';

const image = new Hono();

image.use('/random/*', authMiddleware);
image.use('/random', authMiddleware);
image.use('/image/*', authMiddleware);

function getFormat(c: { req: { query: (key: string) => string | undefined } }): ResponseFormat {
  const q = c.req.query('format');
  if (q === 'json' || q === 'stream') return q;
  const def = process.env.DEFAULT_RESPONSE_FORMAT;
  if (def === 'json' || def === 'stream') return def;
  return 'stream';
}

function buildUrl(category: string, filename: string): string {
  const base = (process.env.BASE_URL || '').replace(/\/$/, '');
  return `${base}/image/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}

async function serveImage(
  c: Parameters<typeof authMiddleware>[0],
  category: string,
  filename: string
) {
  const filePath = getImagePath(category, filename);
  if (!filePath) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const format = getFormat(c);

  if (format === 'json') {
    return c.json({ filename, category, url: buildUrl(category, filename) });
  }

  const mimeType = lookup(filename) || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);

  c.header('Content-Type', mimeType);
  c.header('Content-Length', String(stat.size));
  c.header('Cache-Control', 'public, max-age=86400');

  return c.body(stream as unknown as ReadableStream, 200);
}

image.get('/random', (c) => {
  const result = getRandomImage();
  if (!result) {
    return c.json({ error: 'No images available' }, 404);
  }
  return serveImage(c, result.category, result.filename);
});

image.get('/random/:category', (c) => {
  const category = c.req.param('category');
  const result = getRandomImage(category);
  if (!result) {
    return c.json({ error: `No images in category: ${category}` }, 404);
  }
  return serveImage(c, result.category, result.filename);
});

image.get('/image/:category/:filename', (c) => {
  const category = c.req.param('category');
  const filename = c.req.param('filename');
  return serveImage(c, category, filename);
});

export { image };
