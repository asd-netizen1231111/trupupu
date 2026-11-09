#!/usr/bin/env bash
# Восстановление дампа (pg_dump -Fc) в БД на сервере.
#
# КАК ЗАПУСКАТЬ (на сервере; БД и пользователь уже созданы, backend остановлен: pm2 stop all):
#   1) Скопировать дамп:  scp D:\Коды\БЭКИ\shop.dump deploy@SERVER_IP:/tmp/shop.dump
#   2) Задать подключение и запустить (пароль не вписывать в файлы и историю — вводится запросом):
#        export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=medusa PGDATABASE=medusa
#        bash deploy/db/restore-server.sh /tmp/shop.dump
#      Пароль: либо export PGPASSWORD (из ~/.pgpass), либо скрипт спросит его сам.
#   3) Затем:  psql ... -v api_domain=api.dobrayahata.by -f deploy/db/fix-urls.sql
#              psql ... -f deploy/db/check-urls.sql
# Аргумент: путь к дампу (по умолчанию /tmp/shop.dump). Подтверждение: введите имя БД или RESTORE_YES=1.
#
# ВНИМАНИЕ: --clean удаляет существующие объекты в целевой БД перед восстановлением.
set -euo pipefail

DUMP="${1:-/tmp/shop.dump}"
: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:?Задайте PGUSER (пользователь БД)}"
: "${PGDATABASE:?Задайте PGDATABASE (имя БД на сервере)}"
export PGHOST PGPORT PGUSER PGDATABASE

[ -f "$DUMP" ] || { echo "Нет файла дампа: $DUMP" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "pg_restore не найден (apt install postgresql-client)" >&2; exit 1; }

if [ -z "${PGPASSWORD:-}" ] && [ ! -f "$HOME/.pgpass" ]; then
  read -r -s -p "Пароль пользователя $PGUSER: " PGPASSWORD; echo
  export PGPASSWORD
fi

if [ "${RESTORE_YES:-}" != "1" ]; then
  echo "Будет ПЕРЕЗАПИСАНА БД '$PGDATABASE' на $PGHOST:$PGPORT из $DUMP"
  read -r -p "Для продолжения введите имя БД: " ans
  [ "$ans" = "$PGDATABASE" ] || { echo "Отмена."; exit 1; }
fi

# Проверка, что дамп читается
pg_restore --list "$DUMP" >/dev/null

# --no-owner/--no-privileges: владельцем станет PGUSER. Код возврата 1 у pg_restore
# часто означает безобидные предупреждения (например, про расширения), поэтому не обрываем сразу.
set +e
pg_restore --no-owner --no-privileges --clean --if-exists --exit-on-error \
  -d "$PGDATABASE" "$DUMP"
rc=$?
set -e
if [ $rc -ne 0 ]; then
  echo "pg_restore завершился с кодом $rc. Если ошибка из-за прав/расширений — проверьте вывод выше." >&2
  echo "Для повтора без --exit-on-error:  pg_restore --no-owner --clean --if-exists -d \"$PGDATABASE\" \"$DUMP\"" >&2
  exit $rc
fi

echo "Готово. Таблицы в public: $(psql -At -c "select count(*) from information_schema.tables where table_schema='public'")"
echo "Дальше: fix-urls.sql, check-urls.sql, затем pm2 start/restart и reindex товаров."
