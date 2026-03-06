"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const factory_1 = require("hono/factory");
const tokenService_js_1 = require("../services/tokenService.js");
exports.authMiddleware = (0, factory_1.createMiddleware)(async (c, next) => {
    let token = null;
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
    if (!(0, tokenService_js_1.validateToken)(token)) {
        return c.json({ error: 'Unauthorized: invalid or inactive token' }, 401);
    }
    await next();
});
//# sourceMappingURL=auth.js.map