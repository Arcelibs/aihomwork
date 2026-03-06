import { Hono } from 'hono';
import path from 'path';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { createToken, listTokens, revokeToken } from '../services/tokenService.js';
import { getCategories, saveUploadedImage } from '../services/imageService.js';

const admin = new Hono();

admin.use('/*', adminAuthMiddleware);

// GET /admin/tokens
admin.get('/tokens', (c) => {
  const tokens = listTokens();
  return c.json({ tokens });
});

// POST /admin/tokens
admin.post('/tokens', async (c) => {
  let name: string;
  try {
    const body = await c.req.json<{ name?: string }>();
    name = (body.name || '').trim();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!name) {
    return c.json({ error: '`name` is required' }, 400);
  }

  const token = createToken(name);
  return c.json({ token, name, message: 'Store this token safely — it will not be shown again.' }, 201);
});

// DELETE /admin/tokens/:id
admin.delete('/tokens/:id', (c) => {
  const idStr = c.req.param('id');
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return c.json({ error: 'Invalid token id' }, 400);
  }

  const ok = revokeToken(id);
  if (!ok) {
    return c.json({ error: 'Token not found' }, 404);
  }
  return c.json({ message: `Token ${id} revoked` });
});

// GET /admin/categories
admin.get('/categories', (c) => {
  const categories = getCategories();
  return c.json({ categories });
});

// POST /admin/upload
admin.post('/upload', async (c) => {
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Expected multipart/form-data' }, 400);
  }

  const category = (formData.get('category') as string | null)?.trim();
  const file = formData.get('file') as File | null;

  if (!category) {
    return c.json({ error: '`category` field is required' }, 400);
  }
  if (!file || !(file instanceof File)) {
    return c.json({ error: '`file` field is required' }, 400);
  }

  const safeCategory = path.basename(category);
  if (!safeCategory || safeCategory === '.' || safeCategory === '..') {
    return c.json({ error: 'Invalid category name' }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = saveUploadedImage(safeCategory, file.name, buffer);

  return c.json({ message: 'Upload successful', category: safeCategory, filename }, 201);
});

export { admin };
