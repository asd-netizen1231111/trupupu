/**
 * Сбрасывает кэш витрины (Next.js) по тегам.
 * Нужны переменные окружения бэкенда: STOREFRONT_URL и REVALIDATE_SECRET.
 */
export async function revalidateStorefront(
  tags: string[],
  logger?: { warn: (msg: string) => void }
) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    logger?.warn("[revalidate] REVALIDATE_SECRET не задан — кэш витрины не сброшен")
    return
  }

  const base = process.env.STOREFRONT_URL || "http://localhost:8000"
  const url = `${base}/api/revalidate?secret=${encodeURIComponent(
    secret
  )}&tags=${encodeURIComponent(tags.join(","))}`

  try {
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) {
      logger?.warn(`[revalidate] витрина ответила ${res.status}`)
    }
  } catch (e) {
    logger?.warn(`[revalidate] ${(e as Error).message}`)
  }
}
