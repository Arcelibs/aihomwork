"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
const factory_1 = require("hono/factory");
exports.adminAuthMiddleware = (0, factory_1.createMiddleware)(async (c, next) => {
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
//# sourceMappingURL=adminAuth.js.map