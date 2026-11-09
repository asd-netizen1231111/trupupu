#!/usr/bin/env bash
# =============================================================================
# Общий цикл сборки и перезапуска. Вызывается из deploy.sh и rollback.sh
# (после git pull / git checkout). Руками обычно не запускают.
#
# Что делает: npm ci -> сборка backend -> .env + npm install в .medusa/server ->
# симлинк static -> db:migrate -> запуск backend -> сборка storefront ->
# запуск storefront -> curl-проверка обоих портов. nginx не трогает.
#
# Переменные (необязательные):
#   KEEP_RUNNING=1      не останавливать процессы на время сборки (меньше простой,
#                       но на 4 ГБ RAM риск OOM, а пересборка под работающим
#                       процессом может дать кратковременные 500/502)
#   SKIP_STOREFRONT=1   собрать и перезапустить только backend (первый деплой до
#                       выпуска HTTPS: витрина при сборке ходит на https://API_DOMAIN)
#   SKIP_MIGRATE=1      пропустить medusa db:migrate
#   STATIC_DIR          каталог фото (по умолчанию /var/www/dobrayahata/static)
#   BACKEND_PORT / STOREFRONT_PORT   порты для проверки (9000 / 8000)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"          # site-internetmag/ (там package.json)
BACKEND_DIR="$APP_ROOT/apps/backend"
SERVER_DIR="$BACKEND_DIR/.medusa/server"
STOREFRONT_DIR="$APP_ROOT/apps/storefront"
ECOSYSTEM="$SCRIPT_DIR/ecosystem.config.js"

STATIC_DIR="${STATIC_DIR:-/var/www/dobrayahata/static}"
BACKEND_PORT="${BACKEND_PORT:-9000}"
STOREFRONT_PORT="${STOREFRONT_PORT:-8000}"
KEEP_RUNNING="${KEEP_RUNNING:-0}"
SKIP_STOREFRONT="${SKIP_STOREFRONT:-0}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"

STEP=0
step() { STEP=$((STEP + 1)); printf '\n\033[1;36m==> [%s] %s\033[0m\n' "$STEP" "$*"; }
info() { printf '    %s\n' "$*"; }
warn() { printf '\033[1;33m    ! %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[1;31mОШИБКА: %s\033[0m\n' "$*" >&2; exit 1; }
trap 'printf "\033[1;31mОШИБКА: сбой на шаге %s (строка %s). Деплой прерван.\033[0m\n" "$STEP" "$LINENO" >&2' ERR

pm2_has() { pm2 describe "$1" >/dev/null 2>&1; }
pm2_stop_if_any() { if pm2_has "$1"; then pm2 stop "$1" >/dev/null; info "остановлен $1"; fi; }

# wait_http URL "коды через пробел" таймаут_сек
wait_http() {
  local url="$1" ok="$2" timeout="${3:-90}" code="000" i
  for ((i = 0; i < timeout; i += 3)); do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$url" || true)"
    for c in $ok; do
      if [[ "$code" == "$c" ]]; then info "$url -> $code"; return 0; fi
    done
    sleep 3
  done
  warn "$url -> $code (ожидалось: $ok)"
  return 1
}

# ----------------------------------------------------------------------------
step "Проверка окружения"
# ----------------------------------------------------------------------------
for bin in node npm pm2 curl git; do
  command -v "$bin" >/dev/null || die "не найден '$bin' в PATH"
done
node -e '
  const need = "22.23.4".split(".").map(Number), have = process.versions.node.split(".").map(Number);
  for (let i = 0; i < 3; i++) { if (have[i] > need[i]) process.exit(0); if (have[i] < need[i]) process.exit(1); }
' || die "нужен Node >= 22.23.4, сейчас $(node -v)"
info "node $(node -v), npm $(npm -v), pm2 $(pm2 -v)"

[[ -f "$APP_ROOT/package-lock.json" ]] || die "нет $APP_ROOT/package-lock.json (нужен для npm ci)"
[[ -f "$BACKEND_DIR/.env" || -f "$BACKEND_DIR/.env.production" ]] \
  || die "нет apps/backend/.env (создайте из deploy/env/backend.env.production.example)"
[[ -f "$STOREFRONT_DIR/.env.production" || -f "$STOREFRONT_DIR/.env" ]] \
  || die "нет apps/storefront/.env.production (шаблон: deploy/env/storefront.env.production.example)"
# Значения не печатаем, только наличие ключей.
for envf in "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.production"; do
  [[ -f "$envf" ]] || continue
  grep -Eq '^MEDUSA_BACKEND_URL=.+' "$envf" && HAS_MBU=1 || true
done
[[ "${HAS_MBU:-0}" == 1 ]] || warn "в backend .env нет MEDUSA_BACKEND_URL (build-переменная админки; будет '/')"

mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
swap_mb="$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
info "RAM ${mem_mb} МБ, swap ${swap_mb} МБ"
if (( mem_mb > 0 && mem_mb <= 4500 && swap_mb < 1024 )); then
  warn "swap < 1 ГБ: сборка Next/Medusa на 4 ГБ RAM может упасть по OOM. Рекомендуется swap 2 ГБ."
fi

# Не допускаем два деплоя одновременно.
if command -v flock >/dev/null; then
  exec 9>/tmp/shop-deploy.lock
  flock -n 9 || die "другой деплой уже выполняется (/tmp/shop-deploy.lock)"
fi

# ----------------------------------------------------------------------------
step "Зависимости монорепо: npm ci (корень, workspaces apps/**)"
# ----------------------------------------------------------------------------
# Один package-lock.json в корне; зависимости обоих приложений поднимаются в
# корневой node_modules. --include=dev: для сборки нужны devDependencies
# (typescript, vite и т.д.), даже если в окружении выставлен NODE_ENV=production.
cd "$APP_ROOT"
npm ci --include=dev --no-audit --no-fund

# ----------------------------------------------------------------------------
step "Остановка backend на время пересборки .medusa (если не KEEP_RUNNING=1)"
# ----------------------------------------------------------------------------
if [[ "$KEEP_RUNNING" == 1 ]]; then info "пропущено (KEEP_RUNNING=1)"; else pm2_stop_if_any shop-backend; fi

# ----------------------------------------------------------------------------
step "Сборка backend: medusa build (turbo не нужен)"
# ----------------------------------------------------------------------------
# NODE_ENV=production: medusa-config.ts читает .env.production/.env из apps/backend
# (MEDUSA_BACKEND_URL вшивается в админку). Результат: apps/backend/.medusa/server
cd "$BACKEND_DIR"
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=2048" npm run build
[[ -f "$SERVER_DIR/package.json" ]] || die "после сборки нет $SERVER_DIR/package.json"
[[ -d "$SERVER_DIR/public/admin" ]] || warn "нет $SERVER_DIR/public/admin: админка /app не собрана"

# ----------------------------------------------------------------------------
step "Копирование .env в .medusa/server и npm install --omit=dev"
# ----------------------------------------------------------------------------
for f in .env .env.production; do
  if [[ -f "$BACKEND_DIR/$f" ]]; then
    install -m 600 "$BACKEND_DIR/$f" "$SERVER_DIR/$f"
    info "скопирован $f"
  fi
done
# .npmrc (auto-install-peers) нужен и здесь: .medusa/server вне workspaces корня.
[[ -f "$APP_ROOT/.npmrc" ]] && cp "$APP_ROOT/.npmrc" "$SERVER_DIR/.npmrc"
cd "$SERVER_DIR"
# lock-файл medusa build не создаёт (он лежит в корне монорепо), поэтому
# npm install, а не npm ci; версии зависят от package.json (точные, 2.22.1).
npm install --omit=dev --no-audit --no-fund
[[ -x "$SERVER_DIR/node_modules/.bin/medusa" ]] || die "в .medusa/server не установился medusa CLI"

# ----------------------------------------------------------------------------
step "Симлинк static -> $STATIC_DIR (фото переживают пересборку)"
# ----------------------------------------------------------------------------
if [[ -d "$STATIC_DIR" ]]; then
  rm -rf "$SERVER_DIR/static"
  ln -sfn "$STATIC_DIR" "$SERVER_DIR/static"
  info "$SERVER_DIR/static -> $STATIC_DIR"
else
  warn "каталога $STATIC_DIR нет: фото будут храниться внутри .medusa/server и пропадут при пересборке (см. deploy/static-sync.md)"
fi

# ----------------------------------------------------------------------------
step "Миграции БД: medusa db:migrate"
# ----------------------------------------------------------------------------
if [[ "$SKIP_MIGRATE" == 1 ]]; then
  info "пропущено (SKIP_MIGRATE=1)"
else
  cd "$SERVER_DIR"
  NODE_ENV=production ./node_modules/.bin/medusa db:migrate
fi

# ----------------------------------------------------------------------------
step "Запуск backend (pm2, порт $BACKEND_PORT)"
# ----------------------------------------------------------------------------
cd "$APP_ROOT"
# Для fork-режима reload = restart; startOrRestart ещё и поднимает остановленный процесс.
pm2 startOrRestart "$ECOSYSTEM" --only shop-backend --update-env
wait_http "http://127.0.0.1:${BACKEND_PORT}/health" "200" 120 \
  || { pm2 logs shop-backend --lines 40 --nostream || true; die "backend не отвечает на /health"; }

if [[ "$SKIP_STOREFRONT" == 1 ]]; then
  info "SKIP_STOREFRONT=1: витрина не пересобирается"
else
  # --------------------------------------------------------------------------
  step "Сборка витрины: next build"
  # --------------------------------------------------------------------------
  # NEXT_PUBLIC_* берутся из apps/storefront/.env.production и вшиваются в сборку.
  # Сборка обращается к API (NEXT_PUBLIC_MEDUSA_BACKEND_URL), поэтому backend уже запущен.
  if [[ "$KEEP_RUNNING" == 1 ]]; then info "storefront не останавливаем (KEEP_RUNNING=1)"; else pm2_stop_if_any shop-storefront; fi
  cd "$APP_ROOT"
  NODE_OPTIONS="--max-old-space-size=2048" npm run build -w @dtc/storefront

  # --------------------------------------------------------------------------
  step "Запуск витрины (pm2, порт $STOREFRONT_PORT)"
  # --------------------------------------------------------------------------
  pm2 startOrRestart "$ECOSYSTEM" --only shop-storefront --update-env
fi

pm2 save >/dev/null
pm2 status

# ----------------------------------------------------------------------------
step "Проверка curl"
# ----------------------------------------------------------------------------
fail=0
wait_http "http://127.0.0.1:${BACKEND_PORT}/health" "200" 60 || fail=1
wait_http "http://127.0.0.1:${BACKEND_PORT}/app" "200 301 302 307 308" 30 || { warn "админка /app не отвечает"; fail=1; }
if [[ "$SKIP_STOREFRONT" != 1 ]]; then
  wait_http "http://127.0.0.1:${STOREFRONT_PORT}/" "200 301 302 307 308" 90 || fail=1
fi
if (( fail )); then
  pm2 logs --lines 30 --nostream || true
  die "проверка не пройдена (логи: pm2 logs)"
fi

printf '\n\033[1;32mГотово: деплой завершён, оба порта отвечают. Версия: %s\033[0m\n' \
  "$(git -C "$APP_ROOT" describe --tags --always 2>/dev/null || echo '?')"
