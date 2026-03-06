"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const db_js_1 = require("./db.js");
const docs_js_1 = require("./routes/docs.js");
const image_js_1 = require("./routes/image.js");
const admin_js_1 = require("./routes/admin.js");
// Initialize DB on startup
(0, db_js_1.getDb)();
const app = new hono_1.Hono();
app.route('/', docs_js_1.docs);
app.route('/', image_js_1.image);
app.route('/admin', admin_js_1.admin);
app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
    console.error(err);
    return c.json({ error: 'Internal server error' }, 500);
});
const port = parseInt(process.env.PORT || '3000', 10);
(0, node_server_1.serve)({ fetch: app.fetch, port }, () => {
    console.log(`[rancom-img-api] listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map