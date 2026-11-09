#!/usr/bin/env bash
# Подставляет домены в шаблоны nginx, ставит конфиги и перезагружает nginx.
#
# Использование (на сервере, от root):
#   sudo ./apply.sh dobrayahata.by api.dobrayahata.by
# Только сгенерировать файлы в ./rendered без установки (можно без root и без nginx):
#   RENDER_ONLY=1 ./apply.sh dobrayahata.by api.dobrayahata.by
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Использование: $0 DOMAIN API_DOMAIN   (например: $0 dobrayahata.by api.dobrayahata.by)" >&2
  exit 1
fi

DOMAIN="$1"
API_DOMAIN="$2"

# Только допустимые символы имени хоста (защита sed и путей)
re='^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
for d in "$DOMAIN" "$API_DOMAIN"; do
  if ! [[ "$d" =~ $re ]]; then
    echo "Некорректное имя домена: $d" >&2
    exit 1
  fi
done

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AVAIL=/etc/nginx/sites-available
ENABLED=/etc/nginx/sites-enabled

render() { # $1 шаблон, $2 результат
  # \b: API_DOMAIN и DOMAIN различаются как отдельные слова (подчёркивание входит в слово)
  sed -e "s/\bAPI_DOMAIN\b/${API_DOMAIN}/g" \
      -e "s/\bDOMAIN\b/${DOMAIN}/g" \
      "$1" > "$2"
}

if [ "${RENDER_ONLY:-0}" = "1" ]; then
  OUT="$SRC_DIR/rendered"
  mkdir -p "$OUT"
  render "$SRC_DIR/DOMAIN.conf"     "$OUT/${DOMAIN}.conf"
  render "$SRC_DIR/API_DOMAIN.conf" "$OUT/${API_DOMAIN}.conf"
  echo "Готово: $OUT/${DOMAIN}.conf, $OUT/${API_DOMAIN}.conf"
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Нужен root: запустите через sudo." >&2
  exit 1
fi
command -v nginx >/dev/null || { echo "nginx не установлен (apt install nginx)." >&2; exit 1; }
mkdir -p "$AVAIL" "$ENABLED"

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP="$(mktemp -d /tmp/nginx-apply-XXXXXX)"
NAMES=("${DOMAIN}.conf" "${API_DOMAIN}.conf")

# Резервная копия того, что уже стояло (чтобы откатиться при ошибке nginx -t)
for n in "${NAMES[@]}"; do
  [ -e "$AVAIL/$n" ]   && cp -a "$AVAIL/$n" "$BACKUP/$n.avail"
  [ -L "$ENABLED/$n" ] && echo link > "$BACKUP/$n.link"
done

rollback() {
  echo "nginx -t не прошёл, откатываю." >&2
  for n in "${NAMES[@]}"; do
    if [ -e "$BACKUP/$n.avail" ]; then cp -a "$BACKUP/$n.avail" "$AVAIL/$n"; else rm -f "$AVAIL/$n"; fi
    if [ -e "$BACKUP/$n.link" ]; then ln -sf "$AVAIL/$n" "$ENABLED/$n"; else rm -f "$ENABLED/$n"; fi
  done
  exit 1
}

render "$SRC_DIR/DOMAIN.conf"     "$AVAIL/${DOMAIN}.conf"
render "$SRC_DIR/API_DOMAIN.conf" "$AVAIL/${API_DOMAIN}.conf"
chmod 644 "$AVAIL/${DOMAIN}.conf" "$AVAIL/${API_DOMAIN}.conf"
ln -sf "$AVAIL/${DOMAIN}.conf"     "$ENABLED/${DOMAIN}.conf"
ln -sf "$AVAIL/${API_DOMAIN}.conf" "$ENABLED/${API_DOMAIN}.conf"

nginx -t || rollback

systemctl reload nginx
echo "Готово ($TS): ${DOMAIN}, www.${DOMAIN}, ${API_DOMAIN}. nginx перезагружен."
echo "Дальше: DNS должен указывать на этот сервер, затем certbot (промт 13)."
