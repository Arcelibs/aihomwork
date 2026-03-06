import { createMiddleware } from 'hono/factory';

export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return c.json({ error: 'Admin not configured' }, 503);
  }

  const provided = c.req.header('X-Admin-Key');
  if (!provided || provided !== adminKey) {
    return c.json({ error: 'Forbidden: invalid admin key' }, 403);
  }

  await next();
});
