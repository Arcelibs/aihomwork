"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
const hono_1 = require("hono");
const path_1 = __importDefault(require("path"));
const adminAuth_js_1 = require("../middleware/adminAuth.js");
const tokenService_js_1 = require("../services/tokenService.js");
const imageService_js_1 = require("../services/imageService.js");
const admin = new hono_1.Hono();
exports.admin = admin;
admin.use('/*', adminAuth_js_1.adminAuthMiddleware);
// GET /admin/tokens
admin.get('/tokens', (c) => {
    const tokens = (0, tokenService_js_1.listTokens)();
    return c.json({ tokens });
});
// POST /admin/tokens
admin.post('/tokens', async (c) => {
    let name;
    try {
        const body = await c.req.json();
        name = (body.name || '').trim();
    }
    catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }
    if (!name) {
        return c.json({ error: '`name` is required' }, 400);
    }
    const token = (0, tokenService_js_1.createToken)(name);
    return c.json({ token, name, message: 'Store this token safely — it will not be shown again.' }, 201);
});
// DELETE /admin/tokens/:id
admin.delete('/tokens/:id', (c) => {
    const idStr = c.req.param('id');
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
        return c.json({ error: 'Invalid token id' }, 400);
    }
    const ok = (0, tokenService_js_1.revokeToken)(id);
    if (!ok) {
        return c.json({ error: 'Token not found' }, 404);
    }
    return c.json({ message: `Token ${id} revoked` });
});
// GET /admin/categories
admin.get('/categories', (c) => {
    const categories = (0, imageService_js_1.getCategories)();
    return c.json({ categories });
});
// POST /admin/upload
admin.post('/upload', async (c) => {
    let formData;
    try {
        formData = await c.req.formData();
    }
    catch {
        return c.json({ error: 'Expected multipart/form-data' }, 400);
    }
    const category = formData.get('category')?.trim();
    const file = formData.get('file');
    if (!category) {
        return c.json({ error: '`category` field is required' }, 400);
    }
    if (!file || !(file instanceof File)) {
        return c.json({ error: '`file` field is required' }, 400);
    }
    const safeCategory = path_1.default.basename(category);
    if (!safeCategory || safeCategory === '.' || safeCategory === '..') {
        return c.json({ error: 'Invalid category name' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (0, imageService_js_1.saveUploadedImage)(safeCategory, file.name, buffer);
    return c.json({ message: 'Upload successful', category: safeCategory, filename }, 201);
});
//# sourceMappingURL=admin.js.map