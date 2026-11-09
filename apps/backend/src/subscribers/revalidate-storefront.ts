import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * При создании/изменении/удалении категорий сбрасывает кэш витрины,
 * чтобы меню «Каталог товаров» и подвал обновились сразу.
 * Нужны переменные окружения бэкенда:
 *   STOREFRONT_URL=http://localhost:8000
 *   REVALIDATE_SECRET=<тот же секрет, что и у витрины>
 */
export default async function revalidateStorefront({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    logger.warn("[revalidate] REVALIDATE_SECRET не задан — кэш витрины не сброшен")
    return
  }

  const base = process.env.STOREFRONT_URL || "http://localhost:8000"
  const url = `${base}/api/revalidate?secret=${encodeURIComponent(
    secret
  )}&tags=categories`

  try {
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) {
      logger.warn(`[revalidate] ${event.name}: витрина ответила ${res.status}`)
    }
  } catch (e) {
    logger.warn(`[revalidate] ${event.name}: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
  ],
}
