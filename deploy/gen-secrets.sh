#!/usr/bin/env bash
# Печатает в терминал новые секреты для production. Ничего не пишет на диск.
# Запуск:  bash deploy/gen-secrets.sh
# Скопируйте значения в .env на сервере вручную; вывод не сохраняйте в файлы
# репозитория и не отправляйте в чаты.
set -euo pipefail

command -v openssl >/dev/null 2>&1 || { echo "Нужен openssl" >&2; exit 1; }

JWT_SECRET="$(openssl rand -hex 32)"
COOKIE_SECRET="$(openssl rand -hex 32)"
REVALIDATE_SECRET="$(openssl rand -hex 32)"
DB_PASSWORD="$(openssl rand -hex 16)"   # только hex — безопасно для DATABASE_URL

echo "# --- backend (.env) ---"
echo "JWT_SECRET=${JWT_SECRET}"
echo "COOKIE_SECRET=${COOKIE_SECRET}"
echo "REVALIDATE_SECRET=${REVALIDATE_SECRET}   # такое же значение и в env витрины"
echo
echo "# --- storefront (.env.production) ---"
echo "REVALIDATE_SECRET=${REVALIDATE_SECRET}"
echo
echo "# --- Postgres: пароль роли БД (и в DATABASE_URL бэкенда) ---"
echo "DB_PASSWORD=${DB_PASSWORD}"
echo
echo "# DATABASE_URL=postgres://<db_user>:${DB_PASSWORD}@127.0.0.1:5432/medusa-backend"
