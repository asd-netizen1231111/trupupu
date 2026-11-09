-- Поиск всех колонок (text/varchar/json/jsonb/массивы) в схеме public, где встречается шаблон.
-- Как запускать (read-only, меняет только временную таблицу сессии):
--   psql -h localhost -U postgres -d <БД> -v pat=localhost -f deploy/db/find-localhost.sql
-- Пароль: переменная окружения PGPASSWORD или ~/.pgpass (в файлы не записывать).
-- Если -v pat не задан, ищется 'localhost'.
\if :{?pat}
\else
\set pat localhost
\endif

SELECT set_config('hits.pat', :'pat', false) \gset
CREATE TEMP TABLE _hits (tbl text, col text, typ text, rows_cnt bigint);

DO $$
DECLARE
  r record;
  n bigint;
  p text := '%' || current_setting('hits.pat', true) || '%';
BEGIN
  FOR r IN
    SELECT c.table_name t, c.column_name col, c.data_type ty
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
     AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'jsonb', 'json', 'ARRAY')
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I::text ILIKE %L', r.t, r.col, p) INTO n;
    IF n > 0 THEN
      INSERT INTO _hits VALUES (r.t, r.col, r.ty, n);
    END IF;
  END LOOP;
END $$;

SELECT * FROM _hits ORDER BY 1, 2;
