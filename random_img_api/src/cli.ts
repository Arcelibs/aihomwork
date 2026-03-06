import 'dotenv/config';
import { createToken, listTokens, revokeToken } from './services/tokenService.js';
import { getCategories } from './services/imageService.js';

const [, , command, ...args] = process.argv;

function printHelp() {
  console.log(`
rancom-img-api 管理 CLI

用法：
  docker exec -it <container> node /app/dist/cli.js <指令>

指令：
  token:list              列出所有 token
  token:create <name>     新增 token（name 為描述名稱）
  token:revoke <id>       撤銷指定 token（不可逆）
  category:list           列出目前所有圖片分類

範例：
  docker exec -it rancom-img-api node /app/dist/cli.js token:list
  docker exec -it rancom-img-api node /app/dist/cli.js token:create my-app
  docker exec -it rancom-img-api node /app/dist/cli.js token:revoke 3
`);
}

switch (command) {
  case 'token:list': {
    const tokens = listTokens();
    if (tokens.length === 0) {
      console.log('（尚無 token）');
    } else {
      console.log('');
      console.log(
        ['ID', '名稱', 'Token（前8碼）', '狀態', '使用次數', '最後使用'].join('\t')
      );
      console.log('─'.repeat(72));
      for (const t of tokens) {
        const status = t.is_active ? '✓ 啟用' : '✗ 已撤銷';
        const lastUsed = t.last_used_at ?? '從未使用';
        console.log(
          [t.id, t.name, t.token_preview, status, t.request_count, lastUsed].join('\t')
        );
      }
      console.log('');
    }
    break;
  }

  case 'token:create': {
    const name = args.join(' ').trim();
    if (!name) {
      console.error('錯誤：請提供 token 名稱');
      console.error('  例如：token:create my-app');
      process.exit(1);
    }
    const token = createToken(name);
    console.log('');
    console.log('Token 建立成功');
    console.log('──────────────────────────────────────────');
    console.log(`名稱：  ${name}`);
    console.log(`Token： ${token}`);
    console.log('──────────────────────────────────────────');
    console.log('請妥善保存，之後列表只顯示前 8 碼。');
    console.log('');
    break;
  }

  case 'token:revoke': {
    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
      console.error('錯誤：請提供有效的 token ID');
      console.error('  例如：token:revoke 1');
      process.exit(1);
    }
    const ok = revokeToken(id);
    if (ok) {
      console.log(`Token #${id} 已撤銷。`);
    } else {
      console.error(`找不到 Token ID: ${id}`);
      process.exit(1);
    }
    break;
  }

  case 'category:list': {
    const cats = getCategories();
    if (cats.length === 0) {
      console.log('（尚無分類，請先放圖片到 data/images/<分類名>/ 目錄）');
    } else {
      console.log(`\n共 ${cats.length} 個分類：`);
      cats.forEach((cat) => console.log(`  • ${cat}`));
      console.log('');
    }
    break;
  }

  default: {
    printHelp();
    break;
  }
}

process.exit(0);
