import { createMiddleware } from 'hono/factory';
import { validateToken } from '../services/tokenService.js';

export const authMiddleware = createMiddleware(async (c, next) => {
  let token: string | null = null;

  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    token = c.req.query('token') ?? null;
  }

  if (!token) {
    return c.json({ error: 'Unauthorized: token required' }, 401);
  }

  if (!validateToken(token)) {
    return c.json({ error: 'Unauthorized: invalid or inactive token' }, 401);
  }

  await next();
});
