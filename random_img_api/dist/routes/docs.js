"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docs = void 0;
const hono_1 = require("hono");
const imageService_js_1 = require("../services/imageService.js");
const docs = new hono_1.Hono();
exports.docs = docs;
docs.get('/', (c) => {
    const categories = (0, imageService_js_1.getCategories)();
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const categoryRows = categories.length > 0
        ? categories.map((cat) => `<li><code>${cat}</code></li>`).join('\n            ')
        : '<li><em>尚無分類，請先上傳圖片</em></li>';
    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Random Image API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container { max-width: 860px; margin: 0 auto; }
    h1 { color: #f0f6fc; font-size: 2rem; margin-bottom: 0.25rem; }
    .subtitle { color: #8b949e; margin-bottom: 2.5rem; }
    h2 { color: #f0f6fc; font-size: 1.25rem; margin: 2rem 0 0.75rem; border-bottom: 1px solid #21262d; padding-bottom: 0.4rem; }
    h3 { color: #e6edf3; font-size: 1rem; margin: 1.25rem 0 0.5rem; }
    p { margin-bottom: 0.75rem; color: #8b949e; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 4px;
      padding: 0.1em 0.4em;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.875em;
      color: #f0883e;
    }
    pre {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      margin: 0.5rem 0 1rem;
    }
    pre code {
      background: none;
      border: none;
      padding: 0;
      color: #e6edf3;
      font-size: 0.875rem;
    }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; }
    th {
      background: #161b22;
      color: #8b949e;
      font-weight: 600;
      text-align: left;
      padding: 0.5rem 0.75rem;
      border: 1px solid #30363d;
      font-size: 0.875rem;
    }
    td {
      padding: 0.5rem 0.75rem;
      border: 1px solid #30363d;
      font-size: 0.875rem;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #161b22; }
    .badge {
      display: inline-block;
      padding: 0.1em 0.5em;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-get { background: #1f6feb; color: #fff; }
    .badge-post { background: #238636; color: #fff; }
    .badge-delete { background: #b91c1c; color: #fff; }
    .badge-none { background: #30363d; color: #8b949e; }
    .badge-token { background: #9333ea; color: #fff; }
    .badge-admin { background: #d97706; color: #fff; }
    ul { padding-left: 1.5rem; color: #8b949e; }
    ul li { margin-bottom: 0.25rem; }
    .categories { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0 1rem; }
    .cat-tag {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 0.2em 0.75em;
      font-size: 0.85rem;
      color: #58a6ff;
    }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #21262d; color: #484f58; font-size: 0.85rem; text-align: center; }
  </style>
</head>
<body>
<div class="container">
  <h1>Random Image API</h1>
  <p class="subtitle">隨機圖片 API — 需要 Bearer Token 驗證</p>

  <h2>端點一覽</h2>
  <table>
    <thead>
      <tr>
        <th>方法</th>
        <th>路徑</th>
        <th>說明</th>
        <th>驗證</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/</code></td>
        <td>此說明頁</td>
        <td><span class="badge badge-none">無</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/random</code></td>
        <td>全庫隨機取一張圖片</td>
        <td><span class="badge badge-token">Token</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/random/:category</code></td>
        <td>指定分類隨機取一張</td>
        <td><span class="badge badge-token">Token</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/image/:category/:filename</code></td>
        <td>取得指定圖片</td>
        <td><span class="badge badge-token">Token</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/admin/tokens</code></td>
        <td>列出所有 token</td>
        <td><span class="badge badge-admin">Admin</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/admin/tokens</code></td>
        <td>新增 token</td>
        <td><span class="badge badge-admin">Admin</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-delete">DELETE</span></td>
        <td><code>/admin/tokens/:id</code></td>
        <td>撤銷 token</td>
        <td><span class="badge badge-admin">Admin</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/admin/categories</code></td>
        <td>列出所有分類</td>
        <td><span class="badge badge-admin">Admin</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/admin/upload</code></td>
        <td>上傳圖片 (multipart/form-data)</td>
        <td><span class="badge badge-admin">Admin</span></td>
      </tr>
    </tbody>
  </table>

  <h2>認證方式</h2>
  <h3>Bearer Token（一般 API）</h3>
  <p>透過 <code>Authorization</code> header 或 <code>?token=</code> query 帶入：</p>
  <pre><code>Authorization: Bearer &lt;your-token&gt;</code></pre>
  <pre><code>${baseUrl}/random?token=&lt;your-token&gt;</code></pre>

  <h3>Admin Key</h3>
  <p>管理端點使用 <code>X-Admin-Key</code> header：</p>
  <pre><code>X-Admin-Key: &lt;admin-key&gt;</code></pre>

  <h2>回傳格式</h2>
  <p>預設以 stream 方式直接回傳圖片二進位。使用 <code>?format=json</code> 改為 JSON：</p>
  <pre><code>{
  "filename": "example.jpg",
  "category": "nature",
  "url": "${baseUrl}/image/nature/example.jpg"
}</code></pre>

  <h2>目前可用分類</h2>
  <div class="categories">
    ${categories.length > 0
        ? categories.map((cat) => `<span class="cat-tag">${cat}</span>`).join('\n    ')
        : '<span style="color:#484f58">尚無分類，請先上傳圖片</span>'}
  </div>

  <h2>curl 範例</h2>

  <h3>取得隨機圖片（stream）</h3>
  <pre><code>curl -H "Authorization: Bearer &lt;token&gt;" \\
  ${baseUrl}/random -o image.jpg</code></pre>

  <h3>取得 JSON 格式</h3>
  <pre><code>curl -H "Authorization: Bearer &lt;token&gt;" \\
  "${baseUrl}/random?format=json"</code></pre>

  <h3>指定分類</h3>
  <pre><code>curl -H "Authorization: Bearer &lt;token&gt;" \\
  ${baseUrl}/random/nature -o image.jpg</code></pre>

  <h3>新增 Token</h3>
  <pre><code>curl -X POST ${baseUrl}/admin/tokens \\
  -H "X-Admin-Key: &lt;admin-key&gt;" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-app"}'</code></pre>

  <h3>列出所有 Token</h3>
  <pre><code>curl ${baseUrl}/admin/tokens \\
  -H "X-Admin-Key: &lt;admin-key&gt;"</code></pre>

  <h3>撤銷 Token</h3>
  <pre><code>curl -X DELETE ${baseUrl}/admin/tokens/1 \\
  -H "X-Admin-Key: &lt;admin-key&gt;"</code></pre>

  <h3>上傳圖片</h3>
  <pre><code>curl -X POST ${baseUrl}/admin/upload \\
  -H "X-Admin-Key: &lt;admin-key&gt;" \\
  -F "category=nature" \\
  -F "file=@/path/to/image.jpg"</code></pre>

  <footer>Random Image API &mdash; Powered by Hono + Node.js</footer>
</div>
</body>
</html>`;
    return c.html(html);
});
//# sourceMappingURL=docs.js.map