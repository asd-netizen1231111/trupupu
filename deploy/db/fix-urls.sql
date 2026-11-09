-- Замена адресов локальной разработки на боевой API-домен во всех текстовых/json колонках схемы public.
--
-- КАК ЗАПУСКАТЬ (на сервере, ПОСЛЕ restore-server.sh, один раз; повторный запуск безопасен):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--        -v api_domain=api.dobrayahata.by \
--        -f deploy/db/fix-urls.sql
-- Необязательные параметры:
--   -v old_url=http://localhost:9000   (что заменять; по умолчанию это значение)
--   -v scheme=https                    (схема нового адреса; по умолчанию https)
-- Результат: все 'http://localhost:9000' -> 'https://api.dobrayahata.by'. Всё в одной транзакции.
-- После замены выполните deploy/db/check-urls.sql и переиндексацию товаров (job reindex-products).
--
-- Что найдено по локальной БД (deploy/db/find-localhost.sql):
--   product.thumbnail, image.url, cart_line_item.thumbnail, order_line_item.thumbnail,
--   search_pg_product_v2.document / .indexed (jsonb, индекс поиска).
-- Скрипт обходит ВСЕ колонки text / varchar / json / jsonb схемы public (кроме генерируемых),
-- поэтому подхватит и таблицы site-settings, face, reviews и т.п., если там появятся такие ссылки.
-- Массивы (text[]) не обрабатываются — их покажет check-urls.sql.

\set ON_ERROR_STOP on
\if :{?api_domain}
\else
  \echo 'ОШИБКА: не задан api_domain. Пример: -v api_domain=api.dobrayahata.by'
  DO $$ BEGIN RAISE EXCEPTION 'api_domain не задан'; END $$;
\endif
\if :{?old_url}
\else
  \set old_url http://localhost:9000
\endif
\if :{?scheme}
\else
  \set scheme https
\endif

\set ON_ERROR_STOP on

BEGIN;

SELECT set_config('fix.old', :'old_url', true) AS _o,
       set_config('fix.new', :'scheme' || '://' || :'api_domain', true) AS _n
\gset

DO $$
DECLARE
  r record;
  old_u text := current_setting('fix.old');
  new_u text := current_setting('fix.new');
  n bigint;
BEGIN
  IF old_u = '' OR new_u = '' OR old_u = new_u THEN
    RAISE EXCEPTION 'Некорректные параметры: old=%, new=%', old_u, new_u;
  END IF;

  FOR r IN
    SELECT c.table_name AS t, c.column_name AS col, c.data_type AS ty
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
     AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
      AND c.is_generated = 'NEVER'
    ORDER BY c.table_name, c.ordinal_position
  LOOP
    IF r.ty IN ('json', 'jsonb') THEN
      -- jsonb -> text -> replace -> обратно в json/jsonb
      EXECUTE format(
        'UPDATE public.%1$I SET %2$I = replace(%2$I::text, %3$L, %4$L)::%5$s WHERE %2$I::text LIKE %6$L',
        r.t, r.col, old_u, new_u, r.ty, '%' || old_u || '%');
    ELSE
      EXECUTE format(
        'UPDATE public.%1$I SET %2$I = replace(%2$I, %3$L, %4$L) WHERE %2$I LIKE %5$L',
        r.t, r.col, old_u, new_u, '%' || old_u || '%');
    END IF;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      RAISE NOTICE 'public.%.%: обновлено строк %', r.t, r.col, n;
    END IF;
  END LOOP;
END $$;

COMMIT;
