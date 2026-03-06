"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = createToken;
exports.listTokens = listTokens;
exports.revokeToken = revokeToken;
exports.validateToken = validateToken;
const nanoid_1 = require("nanoid");
const db_js_1 = require("../db.js");
function createToken(name) {
    const db = (0, db_js_1.getDb)();
    const token = (0, nanoid_1.nanoid)(32);
    db.prepare('INSERT INTO tokens (token, name) VALUES (?, ?)').run(token, name);
    return token;
}
function listTokens() {
    const db = (0, db_js_1.getDb)();
    const rows = db.prepare('SELECT id, token, name, created_at, last_used_at, is_active, request_count FROM tokens ORDER BY id DESC').all();
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
function revokeToken(id) {
    const db = (0, db_js_1.getDb)();
    const result = db.prepare('UPDATE tokens SET is_active = 0 WHERE id = ?').run(id);
    return result.changes > 0;
}
function validateToken(token) {
    const db = (0, db_js_1.getDb)();
    const row = db.prepare('SELECT id FROM tokens WHERE token = ? AND is_active = 1').get(token);
    if (!row)
        return false;
    db.prepare('UPDATE tokens SET last_used_at = datetime(\'now\'), request_count = request_count + 1 WHERE id = ?').run(row.id);
    return true;
}
//# sourceMappingURL=tokenService.js.map