/**
 * pm2: два процесса (backend Medusa :9000, storefront Next.js :8000).
 *
 * Запуск (на сервере, пользователь deploy):
 *   pm2 startOrReload deploy/ecosystem.config.js --update-env
 *   pm2 save && pm2 startup     # автозапуск после перезагрузки (один раз)
 *
 * Переменные окружения (необязательные):
 *   APP_ROOT  - корень монорепо (там package.json, apps/). По умолчанию - родитель каталога deploy/.
 *   LOG_DIR   - каталог логов. По умолчанию /var/log/shop (если есть и доступен на запись), иначе ~/logs/shop.
 *
 * Секреты здесь НЕ хранятся:
 *   backend    - читает .env из своего cwd (apps/backend/.medusa/server/.env, копируется deploy.sh);
 *   storefront - Next сам читает apps/storefront/.env.production.
 *
 * Важно: backend запускать ТОЛЬКО одним экземпляром в режиме fork (in-memory event bus/locking, Redis нет).
 */
const fs = require("fs")
const os = require("os")
const path = require("path")

const ROOT = process.env.APP_ROOT
  ? path.resolve(process.env.APP_ROOT)
  : path.resolve(__dirname, "..")

const BACKEND_DIR = path.join(ROOT, "apps", "backend", ".medusa", "server")
const STOREFRONT_DIR = path.join(ROOT, "apps", "storefront")

function pickLogDir() {
  const candidates = [process.env.LOG_DIR, "/var/log/shop", path.join(os.homedir(), "logs", "shop")]
  for (const dir of candidates) {
    if (!dir) continue
    try {
      fs.mkdirSync(dir, { recursive: true })
      fs.accessSync(dir, fs.constants.W_OK)
      return dir
    } catch (_) {
      /* пробуем следующий */
    }
  }
  return os.tmpdir()
}
const LOG_DIR = pickLogDir()

// Первый существующий путь (зависимости могут лежать как рядом, так и в корне монорепо).
function firstExisting(paths) {
  return paths.find((p) => fs.existsSync(p)) || paths[0]
}

// medusa CLI из node_modules, установленных в .medusa/server (npm install --omit=dev).
const MEDUSA_CLI = firstExisting([
  path.join(BACKEND_DIR, "node_modules", "@medusajs", "cli", "cli.js"),
  path.join(ROOT, "node_modules", "@medusajs", "cli", "cli.js"),
])

// next: hoisted в корень монорепо или локально в apps/storefront.
const NEXT_BIN = firstExisting([
  path.join(STOREFRONT_DIR, "node_modules", "next", "dist", "bin", "next"),
  path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
])

const common = {
  exec_mode: "fork", // не cluster
  instances: 1,
  autorestart: true,
  watch: false,
  min_uptime: "20s", // упал раньше - считается неудачным стартом
  max_restarts: 15, // затем pm2 перестаёт перезапускать (errored)
  exp_backoff_restart_delay: 200, // растущая пауза между перезапусками
  kill_timeout: 15000, // время на graceful shutdown перед SIGKILL
  time: true, // метка времени в логах
  merge_logs: true,
}

module.exports = {
  apps: [
    {
      ...common,
      name: "shop-backend",
      cwd: BACKEND_DIR,
      script: MEDUSA_CLI,
      args: "start -p 9000",
      interpreter: "node",
      node_args: "--max-old-space-size=1280",
      max_memory_restart: "1500M",
      out_file: path.join(LOG_DIR, "backend.out.log"),
      error_file: path.join(LOG_DIR, "backend.err.log"),
      env: {
        NODE_ENV: "production",
        PORT: "9000",
      },
    },
    {
      ...common,
      name: "shop-storefront",
      cwd: STOREFRONT_DIR,
      script: NEXT_BIN,
      args: "start -p 8000",
      interpreter: "node",
      node_args: "--max-old-space-size=768",
      max_memory_restart: "900M",
      out_file: path.join(LOG_DIR, "storefront.out.log"),
      error_file: path.join(LOG_DIR, "storefront.err.log"),
      env: {
        NODE_ENV: "production",
        PORT: "8000",
      },
    },
  ],
}
