@echo off
rem ==========================================================================
rem Дамп локальной БД Medusa (pg_dump -Fc) в файл ВНЕ репозитория.
rem
rem КАК ЗАПУСКАТЬ (Windows, cmd или двойной клик):
rem   deploy\db\dump-local.bat
rem Параметры берутся из переменных окружения (пароль в файл НЕ записывается):
rem   PGHOST      по умолчанию localhost
rem   PGPORT      по умолчанию 5432
rem   PGUSER      по умолчанию postgres
rem   PGDATABASE  по умолчанию medusa-site-internetmag (имя локальной БД; поменяйте, если у вас medusa-backend)
rem   PGPASSWORD  если не задан, pg_dump спросит пароль сам
rem   PG_BIN      папка bin PostgreSQL, по умолчанию C:\Program Files\PostgreSQL\16\bin
rem   DUMP_FILE   куда писать, по умолчанию D:\Коды\БЭКИ\shop.dump (папка в .gitignore)
rem Пример:
rem   set PGDATABASE=medusa-backend ^& set PGUSER=postgres ^& deploy\db\dump-local.bat
rem Дальше: скопировать файл на сервер (scp) и запустить deploy/db/restore-server.sh.
rem ==========================================================================
chcp 65001 >nul
setlocal

if not defined PGHOST     set "PGHOST=localhost"
if not defined PGPORT     set "PGPORT=5432"
if not defined PGUSER     set "PGUSER=postgres"
if not defined PGDATABASE set "PGDATABASE=medusa-site-internetmag"
if not defined PG_BIN     set "PG_BIN=C:\Program Files\PostgreSQL\16\bin"
if not defined DUMP_FILE  set "DUMP_FILE=D:\Коды\БЭКИ\shop.dump"

if not exist "%PG_BIN%\pg_dump.exe" (
  echo ОШИБКА: не найден "%PG_BIN%\pg_dump.exe". Задайте PG_BIN.
  exit /b 1
)

for %%I in ("%DUMP_FILE%") do set "DUMP_DIR=%%~dpI"
if not exist "%DUMP_DIR%" mkdir "%DUMP_DIR%"

echo Дамп БД "%PGDATABASE%" (%PGUSER%@%PGHOST%:%PGPORT%) в "%DUMP_FILE%"
"%PG_BIN%\pg_dump.exe" -Fc --no-owner --no-privileges -h "%PGHOST%" -p "%PGPORT%" -U "%PGUSER%" -d "%PGDATABASE%" -f "%DUMP_FILE%"
if errorlevel 1 (
  echo ОШИБКА: pg_dump завершился с ошибкой.
  exit /b 1
)

for %%I in ("%DUMP_FILE%") do echo Готово: %%~fI, %%~zI байт
endlocal
