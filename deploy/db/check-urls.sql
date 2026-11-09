-- Проверка после fix-urls.sql: в БД не должно остаться 'localhost' (и 127.0.0.1).
--
-- КАК ЗАПУСКАТЬ (только чтение):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f deploy/db/check-urls.sql
-- Другой шаблон:  -v pat=localhost   (по умолчанию ищется 'localhost' и '127.0.0.1')
-- Ожидаемый результат: первая таблица пустая («0 строк»), статус OK.
-- Вторая таблица — справка: какие хосты вообще встречаются в ссылках на изображения.

\if :{?pat}
\else
  \set pat localhost
\endif

SELECT set_config('chk.pat', :'pat', false) AS _p \gset

CREATE TEMP TABLE _left (tbl text, col text, typ text, rows_cnt bigint);

DO $$
DECLARE
  r record;
  n bigint;
  p1 text := '%' || current_setting('chk.pat') || '%';
  p2 text := '%127.0.0.1%';
BEGIN
  FOR r IN
    SELECT c.table_name AS t, c.column_name AS col, c.data_type AS ty
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
     AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb', 'ARRAY')
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I::text ILIKE %L OR %I::text ILIKE %L',
      r.t, r.col, p1, r.col, p2) INTO n;
    IF n > 0 THEN
      INSERT INTO _left VALUES (r.t, r.col, r.ty, n);
    END IF;
  END LOOP;
END $$;

\echo '--- Остатки localhost / 127.0.0.1 (должно быть 0 строк) ---'
SELECT * FROM _left ORDER BY 1, 2;

SELECT CASE WHEN count(*) = 0 THEN 'OK: localhost в базе не найден'
            ELSE 'ОШИБКА: остались адреса localhost, см. таблицу выше' END AS status
FROM _left;

\echo '--- Справка: хосты в ссылках на изображения ---'
SELECT substring(u from 'https?://[^/"]+') AS host, count(*) AS cnt
FROM (
  SELECT thumbnail AS u FROM public.product
  UNION ALL SELECT url FROM public.image
) s
WHERE u IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC;
