# Копирование фото (`apps/backend/static`) на сервер

Фото товаров лежат в `apps/backend/static` (локальный file-провайдер Medusa). В БД хранятся полные URL
`https://api.dobrayahata.by/static/<файл>` (после `fix-urls.sql`), сами файлы нужно перенести отдельно.
Каталог на сервере — вне репозитория: `/var/www/dobrayahata/static` (см. «Промт 2», п. 2: на него делается симлинк
`apps/backend/.medusa/server/static`, чтобы фото не пропадали при `medusa build`).

Замените `SERVER_IP` на 134.17.16.242. Пользователь: `user` (пока нет `deploy`), позже `deploy` по SSH-ключу.

## 1. Подготовка каталога (на сервере, один раз)
```bash
sudo mkdir -p /var/www/dobrayahata/static
sudo chown -R deploy:deploy /var/www/dobrayahata      # владелец — пользователь, под которым работает pm2
```
(Если `deploy` ещё не создан — временно `user:user`, потом `chown` на `deploy`.)

## 2. Копирование с Windows

**Вариант A — rsync (Git Bash / WSL; повторные запуски передают только изменения):**
```bash
rsync -avz --progress /d/Коды/site-internetmag/apps/backend/static/ user@SERVER_IP:/var/www/dobrayahata/static/
```
Слеш в конце путей обязателен (копируется содержимое каталога).

**Вариант B — scp (встроен в Windows 10/11, PowerShell):**
```powershell
scp -r "D:\Коды\site-internetmag\apps\backend\static\*" user@SERVER_IP:/var/www/dobrayahata/static/
```

## 3. Права (на сервере)
```bash
sudo chown -R deploy:deploy /var/www/dobrayahata/static
sudo find /var/www/dobrayahata/static -type d -exec chmod 755 {} \;
sudo find /var/www/dobrayahata/static -type f -exec chmod 644 {} \;
# nginx (www-data) должен иметь право пройти по пути к каталогу и читать файлы:
sudo chmod 755 /var/www /var/www/dobrayahata
```
Права `755/644` достаточны: пишет в каталог только `deploy` (процесс Medusa при загрузке из админки), читают все.

## 4. Проверка
```bash
ls -la /var/www/dobrayahata/static | head
curl -I https://api.dobrayahata.by/static/<имя_файла>.jpg     # ожидается 200 и image/*
```
Список файлов, на которые ссылается БД, и совпадение имён: после восстановления
`psql ... -c "select url from image"`; имена файлов должны совпадать с содержимым каталога.

## Заметки
- Файлы в локальном `static` могут быть не только из `image`, но и файлы других типов (импорт, вложения) — копируем всё.
- `static/` в бэкапы сервера включить (`/var/www/dobrayahata/static`).
- Загрузки в `static`, сделанные на проде после переноса, при повторном `rsync` с локальной машины не удаляются (флаг `--delete` НЕ использовать).
