#!/usr/bin/env bash
# Резервная копия магазина: БД Postgres (pg_dump -Fc) + папка с фото (static) в tar.gz.
#
# Результат в $BACKUP_DIR (по умолчанию /var/backups/shop):
#   db-ГГГГММДД.dump          - pg_dump -Fc (сжатый, восстанавливается pg_restore)
#   static-ГГГГММДД.tar.gz    - содержимое каталога static
#   backup.log                - лог (при росте больше 5 МБ обрезается до последних 5000 строк)
# Хранится KEEP=14 последних копий каждого вида. Старые удаляются только после успешной новой копии.
# Код возврата: 0 - всё хорошо; 1 - любая ошибка (в том числе в необязательной выгрузке rsync).
# Повторный запуск в тот же день перезаписывает копии этого дня.
#
# ===== НАСТРОЙКА НА СЕРВЕРЕ (один раз, под пользователем deploy) =====
# 1) Каталог для копий (владелец deploy, доступ только ему):
#      sudo mkdir -p /var/backups/shop && sudo chown deploy:deploy /var/backups/shop && sudo chmod 700 /var/backups/shop
# 2) Доступ к БД БЕЗ пароля в скрипте и без записи в cron: файл ~/.pgpass (права 600 обязательны):
#      printf '%s\n' '127.0.0.1:5432:medusa-backend:ИМЯ_ПОЛЬЗОВАТЕЛЯ_БД:ПАРОЛЬ' > ~/.pgpass && chmod 600 ~/.pgpass
#    (пароль подставьте руками при вводе; в чат и репозиторий его не пишите)
# 3) Имя пользователя БД (не секрет) - в файл настроек, он подхватывается автоматически:
#      mkdir -p ~/.config && printf '%s\n' 'PGUSER=ИМЯ_ПОЛЬЗОВАТЕЛЯ_БД' > ~/.config/shop-backup.env
#    Там же можно переопределить: PGHOST, PGPORT, PGDATABASE, BACKUP_DIR, STATIC_DIR, KEEP, LOG_FILE, MIN_FREE_MB.
# 4) Инструменты: sudo apt install postgresql-client   (pg_dump, pg_restore; flock и tar уже есть)
# 5) Пробный запуск вручную:   bash deploy/backup.sh; echo "код: $?"; tail -n 20 /var/backups/shop/backup.log
# 6) Расписание (ежедневно в 03:30) - строка в deploy/backup.cron. Установка в crontab пользователя deploy:
#      crontab -l 2>/dev/null | grep -q 'deploy/backup.sh' || (crontab -l 2>/dev/null; cat deploy/backup.cron) | crontab -
#      crontab -l                                  # проверить
#    Вручную: crontab -e и вставить строку из backup.cron (путь к скрипту поправьте под свой каталог).
#    Часовой пояс сервера влияет на "03:30": sudo timedatectl set-timezone Europe/Minsk
#
# Необязательная выгрузка на другой сервер - блок "ВЫГРУЗКА НА ДРУГОЙ СЕРВЕР" в конце файла.
set -Eeuo pipefail
umask 077

# ---------- настройки ----------
CONF="${BACKUP_CONF:-$HOME/.config/shop-backup.env}"
# shellcheck disable=SC1090
[[ -f "$CONF" ]] && . "$CONF"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/shop}"
KEEP="${KEEP:-14}"
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/backup.log}"
MIN_FREE_MB="${MIN_FREE_MB:-1024}"

# Фото: вне репозитория (см. static-sync.md); если там нет - каталог из репозитория
STATIC_DIR="${STATIC_DIR:-/var/www/dobrayahata/static}"
[[ -d "$STATIC_DIR" ]] || STATIC_DIR="$APP_ROOT/apps/backend/static"

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${PGDATABASE:-medusa-backend}"
# PGUSER обязателен (проверяется ниже); пароль - только из ~/.pgpass или PGPASSWORD

DATE="$(date +%Y%m%d)"
DB_FILE="$BACKUP_DIR/db-$DATE.dump"
ST_FILE="$BACKUP_DIR/static-$DATE.tar.gz"
TMP_DB="$DB_FILE.part"
TMP_ST="$ST_FILE.part"

# ---------- лог и обработка ошибок ----------
log() { # log УРОВЕНЬ текст
  local line
  line="$(date '+%F %T') [$1] $2"
  echo "$line"
  echo "$line" >>"$LOG_FILE" 2>/dev/null || true
}
die() { log ERROR "$*"; exit 1; }

on_exit() {
  local rc=$?
  # временные файлы удаляем только если держим блокировку (иначе сотрём файлы параллельного запуска)
  [[ "${LOCKED:-0}" = 1 ]] && rm -f -- "$TMP_DB" "$TMP_ST" 2>/dev/null
  if [[ $rc -ne 0 ]]; then
    log ERROR "Бэкап НЕ выполнен (код $rc${LINENO_ERR:+, ошибка команды на строке $LINENO_ERR})"
  fi
}
trap 'LINENO_ERR=$LINENO' ERR
trap on_exit EXIT

# ---------- подготовка ----------
if ! mkdir -p "$BACKUP_DIR" 2>/dev/null || [[ ! -w "$BACKUP_DIR" ]]; then
  echo "Нет доступа к $BACKUP_DIR. Создайте: sudo mkdir -p $BACKUP_DIR && sudo chown $(id -un): $BACKUP_DIR" >&2
  exit 1
fi
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Обрезка лога
if [[ -f "$LOG_FILE" ]] && [[ "$(stat -c %s "$LOG_FILE" 2>/dev/null || echo 0)" -gt 5242880 ]]; then
  tail -n 5000 "$LOG_FILE" >"$LOG_FILE.tmp" && mv -f "$LOG_FILE.tmp" "$LOG_FILE"
fi

# Не запускать две копии одновременно
command -v flock >/dev/null || { echo "flock не найден (пакет util-linux)" >&2; exit 1; }
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || die "Другой бэкап уже выполняется"
LOCKED=1

log INFO "=== Старт бэкапа: БД=$PGDATABASE@$PGHOST:$PGPORT, static=$STATIC_DIR, каталог=$BACKUP_DIR ==="

[[ -n "${PGUSER:-}" ]] || die "Не задан PGUSER (см. настройку в начале backup.sh, файл $CONF)"
export PGUSER
command -v pg_dump >/dev/null    || die "pg_dump не найден (sudo apt install postgresql-client)"
command -v pg_restore >/dev/null || die "pg_restore не найден (sudo apt install postgresql-client)"
[[ -d "$STATIC_DIR" ]] || die "Нет каталога с фото: $STATIC_DIR"

free_mb="$(df --output=avail -m "$BACKUP_DIR" | tail -n 1 | tr -d ' ')"
[[ "$free_mb" -ge "$MIN_FREE_MB" ]] || die "Мало места в $BACKUP_DIR: свободно ${free_mb} МБ, нужно не меньше $MIN_FREE_MB"

# ---------- 1. БД ----------
log INFO "pg_dump -Fc -> $(basename "$DB_FILE")"
# -w: никогда не спрашивать пароль (в cron некому отвечать) - пароль берётся из ~/.pgpass
if ! pg_dump -w -Fc --no-owner --no-privileges -f "$TMP_DB" 2>>"$LOG_FILE"; then
  die "pg_dump завершился с ошибкой (проверьте ~/.pgpass, PGUSER, доступность Postgres; детали выше в логе)"
fi
[[ -s "$TMP_DB" ]] || die "Дамп БД пустой"
pg_restore --list "$TMP_DB" >/dev/null 2>>"$LOG_FILE" || die "Дамп БД не читается pg_restore (повреждён)"
mv -f "$TMP_DB" "$DB_FILE"
log INFO "БД готова: $(du -h "$DB_FILE" | cut -f1)"

# ---------- 2. static ----------
log INFO "tar.gz каталога $STATIC_DIR -> $(basename "$ST_FILE")"
set +e
tar -C "$STATIC_DIR" -czf "$TMP_ST" . 2>>"$LOG_FILE"
trc=$?
set -e
# 1 = "файл изменился во время чтения" (кто-то загрузил фото в этот момент): архив пригоден
if [[ $trc -eq 1 ]]; then
  log WARN "tar: файлы менялись во время архивации (код 1), архив принят"
elif [[ $trc -ne 0 ]]; then
  die "tar завершился с кодом $trc"
fi
[[ -s "$TMP_ST" ]] || die "Архив static пустой"
gzip -t "$TMP_ST" 2>>"$LOG_FILE" || die "Архив static повреждён (gzip -t)"
tar -tzf "$TMP_ST" >/dev/null 2>>"$LOG_FILE" || die "Архив static не читается (tar -t)"
mv -f "$TMP_ST" "$ST_FILE"
log INFO "static готов: $(du -h "$ST_FILE" | cut -f1), файлов: $(find "$STATIC_DIR" -type f | wc -l)"

# ---------- 3. ротация: оставить $KEEP последних ----------
prune() { # prune 'маска'
  local pattern="$1" files n i
  shopt -s nullglob
  # glob сортируется по имени, а имя содержит дату ГГГГММДД - старые идут первыми
  cd "$BACKUP_DIR"
  # shellcheck disable=SC2206
  files=( $pattern )
  n=${#files[@]}
  if (( n > KEEP )); then
    for (( i = 0; i < n - KEEP; i++ )); do
      rm -f -- "${files[i]}"
      log INFO "Удалена старая копия: ${files[i]}"
    done
  fi
  shopt -u nullglob
}
prune 'db-????????.dump'
prune 'static-????????.tar.gz'
cd "$APP_ROOT"

log INFO "В каталоге: БД-копий $(find "$BACKUP_DIR" -maxdepth 1 -name 'db-????????.dump' | wc -l), static-копий $(find "$BACKUP_DIR" -maxdepth 1 -name 'static-????????.tar.gz' | wc -l)"

# ======================================================================
# ВЫГРУЗКА НА ДРУГОЙ СЕРВЕР (необязательно) - закомментировано.
#
# Зачем: копии на том же VPS не спасут при потере диска/сервера. Держите хотя бы одну копию на другой машине.
# Как включить:
#  1. На удалённом сервере создайте пользователя (например backup) и каталог: /srv/backups/dobrayahata
#  2. На ЭТОМ сервере под deploy создайте отдельный ключ только для бэкапов (без пароля, для cron):
#       ssh-keygen -t ed25519 -f ~/.ssh/backup_ed25519 -N '' -C 'shop-backup'
#     Положите публичный ключ ~/.ssh/backup_ed25519.pub в ~backup/.ssh/authorized_keys на удалённом сервере.
#     Желательно ограничить ключ: в authorized_keys перед ключом добавьте
#       restrict,command="rrsync /srv/backups/dobrayahata"
#     (rrsync входит в пакет rsync; тогда ключ годится только для rsync в этот каталог).
#  3. Один раз зайдите вручную, чтобы сервер попал в known_hosts (проверьте отпечаток!):
#       ssh -i ~/.ssh/backup_ed25519 backup@REMOTE_HOST
#  4. Раскомментируйте блок ниже и задайте REMOTE_HOST / REMOTE_USER / REMOTE_DIR.
#
# Копируются только db-*.dump и static-*.tar.gz. --delete удаляет на удалённой стороне то,
# чего уже нет здесь (то есть там тоже последние $KEEP копий). Хотите хранить там дольше - уберите --delete.
# Сбой выгрузки даёт код возврата 1, но локальные копии уже сделаны.
#
# REMOTE_USER="backup"
# REMOTE_HOST="backup.example.com"
# REMOTE_DIR="/srv/backups/dobrayahata/"
# REMOTE_KEY="$HOME/.ssh/backup_ed25519"
# log INFO "rsync на ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
# if ! rsync -a --delete --partial \
#       --include='db-????????.dump' --include='static-????????.tar.gz' --exclude='*' \
#       -e "ssh -i $REMOTE_KEY -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20" \
#       "$BACKUP_DIR/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}" 2>>"$LOG_FILE"; then
#   die "Выгрузка rsync на ${REMOTE_HOST} не удалась"
# fi
# log INFO "rsync завершён"
# ======================================================================

log INFO "=== Бэкап завершён успешно ==="
