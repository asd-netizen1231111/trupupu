import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Прайс-листы (скидки на товары) не отправляют событий, а у скидки
 * могут наступить дата начала/окончания. Поэтому раз в 10 минут
 * пересобираем поисковый индекс товаров — каталог и фильтр
 * «Со скидкой» показывают актуальные цены.
 */
export default async function reindexProducts(container: MedusaContainer) {
  const logger = container.resolve("logger")
  try {
    const search = container.resolve(Modules.SEARCH)
    await search.reindex({ index: "product", strategy: "in_place" })
  } catch (e) {
    logger.warn(`[reindex] Не удалось обновить индекс товаров: ${(e as Error).message}`)
  }
}

export const config = {
  name: "reindex-products",
  schedule: "*/10 * * * *",
}
