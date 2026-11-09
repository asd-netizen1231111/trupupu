import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import {
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { isCleanSlug, slugify } from "../lib/slugify"

/**
 * Админка генерирует handle из названия и оставляет кириллицу
 * ("диван-милан"). Этот подписчик переводит такой handle в латиницу
 * ("divan-milan"), чтобы URL были красивыми: /product/divan-milan.
 * Если handle уже латинский (в т.ч. введён вручную) — ничего не делаем,
 * поэтому повторное событие *.updated не зацикливается.
 */
export default async function translitHandles({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const id = event.data?.id
  if (!id) return

  try {
    if (event.name.startsWith("product-category.")) {
      const service = container.resolve(Modules.PRODUCT)
      const category = await service.retrieveProductCategory(id)
      if (isCleanSlug(category.handle)) return

      const base = slugify(category.handle || category.name) || "category"
      const handle = await uniqueHandle(base, async (h) => {
        const found = await service.listProductCategories({ handle: h })
        return found.some((c) => c.id !== id)
      })

      await updateProductCategoriesWorkflow(container).run({
        input: { selector: { id }, update: { handle } },
      })
      logger.info(`[slug] Категория "${category.name}": ${category.handle} -> ${handle}`)
      return
    }

    const service = container.resolve(Modules.PRODUCT)
    const product = await service.retrieveProduct(id)
    if (isCleanSlug(product.handle)) return

    const base = slugify(product.handle || product.title) || "product"
    const handle = await uniqueHandle(base, async (h) => {
      const found = await service.listProducts({ handle: h })
      return found.some((p) => p.id !== id)
    })

    await updateProductsWorkflow(container).run({
      input: { selector: { id }, update: { handle } },
    })
    logger.info(`[slug] Товар "${product.title}": ${product.handle} -> ${handle}`)
  } catch (e) {
    logger.warn(`[slug] Не удалось обновить handle для ${id}: ${(e as Error).message}`)
  }
}

async function uniqueHandle(
  base: string,
  isTaken: (handle: string) => Promise<boolean>
) {
  let handle = base
  for (let i = 2; await isTaken(handle); i++) {
    handle = `${base}-${i}`
  }
  return handle
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product-category.created",
    "product-category.updated",
  ],
}
