# Восстановление из резервной копии

Копии делает `deploy/backup.sh` в `/var/backups/shop`:
- `db-ГГГГММДД.dump` — база (`pg_dump -Fc`);
- `static-ГГГГММДД.tar.gz` — фото товаров (содержимое `/var/www/dobrayahata/static`);
- `backup.log` — лог.

Все команды выполняются на сервере под `deploy`. Пароль БД вводится по запросу или берётся из `~/.pgpass`. В файлы и чат его не записывайте.
Имя БД по умолчанию — `medusa-backend`. Подставьте своего пользователя вместо `DB_USER`.

## 0. Выберите копию и проверьте её
```bash
ls -lh /var/backups/shop
DATE=20260101                                   # дата нужной копии
DUMP=/var/backups/shop/db-$DATE.dump
ARCH=/var/backups/shop/static-$DATE.tar.gz

pg_restore --list "$DUMP" | head -n 20          # дамп читается, видны таблицы
gzip -t "$ARCH" && tar -tzf "$ARCH" | head      # архив целый
tail -n 20 /var/backups/shop/backup.log         # в этот день бэкап завершился без [ERROR]
```
Если копия лежит на другом сервере, сначала скачайте её:
`rsync -av -e "ssh -i ~/.ssh/backup_ed25519" backup@REMOTE_HOST:/srv/backups/dobrayahata/db-$DATE.dump /var/backups/shop/`.

## 1. Репетиция в отдельной БД (рекомендуется, боевая БД не меняется)
Так проверяют, что копия рабочая, не останавливая сайт.
```bash
export PGHOST=127.0.0.1 PGUSER=DB_USER
createdb -T template0 medusa_restore_test                 # нужны права CREATEDB; иначе: sudo -u postgres createdb -O DB_USER medusa_restore_test
pg_restore --no-owner --no-privileges --exit-on-error -d medusa_restore_test "$DUMP"
psql -d medusa_restore_test -At -c "select count(*) from product;"
psql -d medusa_restore_test -At -c "select count(*) from \"order\";"
psql -d medusa_restore_test -At -c "select count(*) from \"user\";"
```
Числа сравните с боевой БД (те же запросы с `-d medusa-backend`). Расхождение допустимо на объём заказов с момента бэкапа.
Потом удалите пробную БД: `dropdb medusa_restore_test`.

Тот же приём для static — в пробный каталог:
```bash
mkdir -p /tmp/static-test && tar -xzf "$ARCH" -C /tmp/static-test
find /tmp/static-test -type f | wc -l                     # сколько файлов в копии
find /var/www/dobrayahata/static -type f | wc -l          # сколько сейчас на сервере
rm -rf /tmp/static-test
```

## 2. Боевое восстановление базы
**Предупреждение:** текущее содержимое БД будет заменено. Перед этим сохраните свежую копию «как есть»:
```bash
PGUSER=DB_USER PGHOST=127.0.0.1 pg_dump -Fc -f /tmp/before-restore.dump medusa-backend
```
(Не используйте для этого `backup.sh`: он перезапишет копию за сегодняшнюю дату, а она может быть той самой, из которой вы восстанавливаетесь.)

1. Остановите приложения, чтобы они не писали в БД:
   ```bash
   pm2 stop shop-backend shop-storefront
   ```
2. Восстановите. Используйте готовый скрипт `deploy/db/restore-server.sh` (он спросит подтверждение — введите имя БД):
   ```bash
   cd ~/site-internetmag
   export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=DB_USER PGDATABASE=medusa-backend
   bash deploy/db/restore-server.sh "$DUMP"
   ```
   Скрипт запускает `pg_restore --clean --if-exists --no-owner --no-privileges`. Если ошибка в правах на расширения, смотрите вывод скрипта.
   Чистое восстановление «с нуля» (когда БД сильно повреждена):
   ```bash
   dropdb medusa-backend && createdb -O DB_USER medusa-backend      # при необходимости через sudo -u postgres
   pg_restore --no-owner --no-privileges --exit-on-error -d medusa-backend "$DUMP"
   ```
3. Ссылки на фото в копии уже с прод-доменом, поэтому `fix-urls.sql` не нужен. Если копия пришла с другого домена, выполните:
   `psql -d medusa-backend -v api_domain=api.dobrayahata.by -f deploy/db/fix-urls.sql`, затем `check-urls.sql`.
4. Если копия старше текущего кода (в коде есть новые миграции), примените их:
   ```bash
   cd ~/site-internetmag/apps/backend/.medusa/server && npx medusa db:migrate
   ```
5. Запустите приложения: `pm2 start shop-backend shop-storefront`.
6. Если в копии нет поискового индекса, обновите его: в админке запустите `/admin/reindex-products` либо job `reindex-products`.

## 3. Восстановление static (фото)
```bash
pm2 stop shop-backend                                     # необязательно, но так надёжнее
mkdir -p /var/www/dobrayahata/static
tar -xzf "$ARCH" -C /var/www/dobrayahata/static           # файлы из копии перезапишут одноимённые, лишние не удаляются
find /var/www/dobrayahata/static -type d -exec chmod 755 {} \;
find /var/www/dobrayahata/static -type f -exec chmod 644 {} \;
pm2 start shop-backend
```
Для точного состояния «как в копии» (удалить файлы, появившиеся позже) сначала очистите каталог:
`find /var/www/dobrayahata/static -mindepth 1 -delete`. Делайте это только после проверки архива (шаг 0).
Симлинк `apps/backend/.medusa/server/static` -> `/var/www/dobrayahata/static` должен остаться на месте (его создаёт `_release.sh`).

## 4. Как убедиться, что восстановление сработало
```bash
pm2 status                                                   # оба процесса online
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9000/health     # 200
curl -s -o /dev/null -w '%{http_code}\n' https://dobrayahata.by/          # 200
psql -d medusa-backend -At -c "select count(*) from product;"             # число товаров как ожидалось
psql -d medusa-backend -At -c "select max(created_at) from \"order\";"    # дата последнего заказа соответствует копии
FILE=$(psql -d medusa-backend -At -c "select url from image limit 1")
curl -sI "$FILE" | head -n 1                                              # HTTP/2 200 — фото открывается
```
Дальше вручную:
1. Откройте `https://api.dobrayahata.by/app`, войдите, откройте список товаров и заказов.
2. Откройте витрину: каталог, страницу товара с фото, добавьте товар в корзину.
3. Просмотрите логи на ошибки: `pm2 logs shop-backend --lines 50 --nostream`.

## 5. Регулярная проверка (раз в месяц)
Выполняйте шаг 1 (репетиция в отдельной БД) на самой свежей копии. Бэкап, который ни разу не восстанавливали, нельзя считать рабочим.

## Если что-то пошло не так
- Не читается дамп: попробуйте предыдущую копию (`ls -lt /var/backups/shop`), поэтому хранится 14 штук.
- `pg_restore: error: ... must be owner of extension`: используйте флаги `--no-owner --no-privileges` (они уже в командах) и убедитесь, что `DB_USER` владеет БД.
- Backend не стартует после восстановления: `pm2 logs shop-backend`. Чаще всего это миграции (шаг 2.4) или `.env` (не меняется при восстановлении БД).
- Вернуться к состоянию до восстановления: `pg_restore` из `/tmp/before-restore.dump` (см. шаг 2).
