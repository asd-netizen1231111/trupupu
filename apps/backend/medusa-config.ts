import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Публичный адрес бэкенда (https://api.dobrayahata.by) — по нему браузер
 * и витрина открывают загруженные фото: <BACKEND_PUBLIC_URL>/static/<файл>.
 * URL записывается в БД при загрузке, поэтому в проде переменная обязательна.
 * В разработке без переменной — http://localhost:9000/static.
 */
const BACKEND_PUBLIC_URL = (process.env.BACKEND_PUBLIC_URL || '').replace(/\/+$/, '')

if (!BACKEND_PUBLIC_URL && process.env.NODE_ENV === 'production') {
  throw new Error(
    'BACKEND_PUBLIC_URL не задан: в production нужен публичный адрес API, например https://api.dobrayahata.by'
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      // CORS, секреты — только из env (дефолтов нет)
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  admin: {
    // Адрес API для админки (/app). Вшивается в сборку админки при `medusa build`,
    // поэтому MEDUSA_BACKEND_URL должен быть задан на этапе сборки.
    // Без переменной админка использует "/" (тот же origin) — для разработки.
    backendUrl: process.env.MEDUSA_BACKEND_URL || '/',
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backend_url: BACKEND_PUBLIC_URL
                ? `${BACKEND_PUBLIC_URL}/static`
                : "http://localhost:9000/static",
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/site-settings",
    },
    {
      resolve: "./src/modules/review",
    },
  ],
})
