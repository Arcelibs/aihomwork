import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { getDb } from './db.js';
import { docs } from './routes/docs.js';
import { image } from './routes/image.js';
import { admin } from './routes/admin.js';

// Initialize DB on startup
getDb();

const app = new Hono();

app.route('/', docs);
app.route('/', image);
app.route('/admin', admin);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3000', 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`[rancom-img-api] listening on http://localhost:${port}`);
});
