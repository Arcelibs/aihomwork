"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.image = void 0;
const hono_1 = require("hono");
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = require("mime-types");
const auth_js_1 = require("../middleware/auth.js");
const imageService_js_1 = require("../services/imageService.js");
const image = new hono_1.Hono();
exports.image = image;
image.use('/random/*', auth_js_1.authMiddleware);
image.use('/random', auth_js_1.authMiddleware);
image.use('/image/*', auth_js_1.authMiddleware);
function getFormat(c) {
    const q = c.req.query('format');
    if (q === 'json' || q === 'stream')
        return q;
    const def = process.env.DEFAULT_RESPONSE_FORMAT;
    if (def === 'json' || def === 'stream')
        return def;
    return 'stream';
}
function buildUrl(category, filename) {
    const base = (process.env.BASE_URL || '').replace(/\/$/, '');
    return `${base}/image/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}
async function serveImage(c, category, filename) {
    const filePath = (0, imageService_js_1.getImagePath)(category, filename);
    if (!filePath) {
        return c.json({ error: 'Image not found' }, 404);
    }
    const format = getFormat(c);
    if (format === 'json') {
        return c.json({ filename, category, url: buildUrl(category, filename) });
    }
    const mimeType = (0, mime_types_1.lookup)(filename) || 'application/octet-stream';
    const stat = fs_1.default.statSync(filePath);
    const stream = fs_1.default.createReadStream(filePath);
    c.header('Content-Type', mimeType);
    c.header('Content-Length', String(stat.size));
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(stream, 200);
}
image.get('/random', (c) => {
    const result = (0, imageService_js_1.getRandomImage)();
    if (!result) {
        return c.json({ error: 'No images available' }, 404);
    }
    return serveImage(c, result.category, result.filename);
});
image.get('/random/:category', (c) => {
    const category = c.req.param('category');
    const result = (0, imageService_js_1.getRandomImage)(category);
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
//# sourceMappingURL=image.js.map