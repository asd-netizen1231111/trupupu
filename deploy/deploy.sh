#!/usr/bin/env bash
# =============================================================================
# Деплой на сервере (пользователь deploy):  bash deploy/deploy.sh
#
# git pull -> npm ci -> medusa build -> .env + npm install в .medusa/server ->
# db:migrate -> next build -> pm2 -> curl-проверка. nginx не трогает.
# Сам цикл сборки лежит в deploy/_release.sh (общий с rollback.sh).
#
# Переменные: BRANCH (по умолчанию main), KEEP_RUNNING, SKIP_STOREFRONT,
# SKIP_MIGRATE, STATIC_DIR - см. шапку _release.sh.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BRANCH="${BRANCH:-main}"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
trap 'printf "\033[1;31mОШИБКА: git-этап прервался (строка %s). Деплой остановлен.\033[0m\n" "$LINENO" >&2' ERR

step "git: обновление ветки $BRANCH"
REPO_ROOT="$(git -C "$APP_ROOT" rev-parse --show-toplevel)"   # корень git может быть выше site-internetmag/
cd "$REPO_ROOT"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ОШИБКА: на сервере есть локальные изменения отслеживаемых файлов:" >&2
  git status --short >&2
  exit 1
fi
OLD="$(git rev-parse --short HEAD)"
git fetch --tags --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "    $OLD -> $(git rev-parse --short HEAD)"

# Дальше работает уже ОБНОВЛЁННЫЙ скрипт сборки (exec: текущий файл деплоя
# мог измениться при pull, bash его не дочитывает).
exec bash "$SCRIPT_DIR/_release.sh"
