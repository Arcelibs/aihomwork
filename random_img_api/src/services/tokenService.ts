import { nanoid } from 'nanoid';
import { getDb } from '../db.js';
import type { Token, TokenListItem } from '../types.js';

export function createToken(name: string): string {
  const db = getDb();
  const token = nanoid(32);
  db.prepare(
    'INSERT INTO tokens (token, name) VALUES (?, ?)'
  ).run(token, name);
  return token;
}

export function listTokens(): TokenListItem[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, token, name, created_at, last_used_at, is_active, request_count FROM tokens ORDER BY id DESC'
  ).all() as Token[];

  return rows.map((r) => ({
    id: r.id,
    token_preview: r.token.slice(0, 8) + '...',
    name: r.name,
    created_at: r.created_at,
    last_used_at: r.last_used_at,
    is_active: r.is_active,
    request_count: r.request_count,
  }));
}

export function revokeToken(id: number): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE tokens SET is_active = 0 WHERE id = ?'
  ).run(id);
  return result.changes > 0;
}

export function validateToken(token: string): boolean {
  const db = getDb();
  const row = db.prepare(
    'SELECT id FROM tokens WHERE token = ? AND is_active = 1'
  ).get(token) as { id: number } | undefined;

  if (!row) return false;

  db.prepare(
    'UPDATE tokens SET last_used_at = datetime(\'now\'), request_count = request_count + 1 WHERE id = ?'
  ).run(row.id);

  return true;
}
