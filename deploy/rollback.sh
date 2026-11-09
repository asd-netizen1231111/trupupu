#!/usr/bin/env bash
# =============================================================================
# Откат на тег:  bash deploy/rollback.sh <тег>
#
# git checkout тега (detached HEAD) и тот же цикл сборки, что у deploy.sh.
# ВНИМАНИЕ: миграции БД НЕ откатываются. Если между версиями были миграции,
# восстановите БД из бэкапа вручную (промт 7) до или после отката.
# Вернуться на актуальную версию: bash deploy/deploy.sh (он сделает checkout main).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  echo "Использование: bash deploy/rollback.sh <тег>" >&2
  echo "Доступные теги (последние 10):" >&2
  git -C "$APP_ROOT" tag --sort=-creatordate | head -n 10 >&2 || true
  exit 2
fi

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
trap 'printf "\033[1;31mОШИБКА: git-этап отката прервался (строка %s).\033[0m\n" "$LINENO" >&2' ERR

step "git: переход на тег $TAG"
REPO_ROOT="$(git -C "$APP_ROOT" rev-parse --show-toplevel)"
cd "$REPO_ROOT"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ОШИБКА: есть локальные изменения отслеживаемых файлов:" >&2
  git status --short >&2
  exit 1
fi
git fetch --tags --force --prune origin
if ! git rev-parse -q --verify "refs/tags/${TAG}^{commit}" >/dev/null; then
  echo "ОШИБКА: тег '$TAG' не найден" >&2
  exit 1
fi
OLD="$(git rev-parse --short HEAD)"
git checkout --detach "refs/tags/$TAG"
echo "    $OLD -> $(git rev-parse --short HEAD) (тег $TAG)"

exec bash "$SCRIPT_DIR/_release.sh"
