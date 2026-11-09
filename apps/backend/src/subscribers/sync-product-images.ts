import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Синхронизирует фото товара в админке:
 *  - если превью (thumbnail) не выбрано — берётся первое изображение;
 *  - если превью есть, но его нет среди изображений — оно добавляется
 *    в список изображений (галерея на странице товара).
 * Так все фото показываются и на странице товара, и в каталоге.
 * Обновление делается только при реальном расхождении, поэтому
 * повторное событие product.updated не зацикливается.
 */
export default async function syncProductImages({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const id = event.data?.id
  if (!id) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "thumbnail", "images.id", "images.url"],
      filters: { id },
    })

    const product = data[0]
    if (!product) return

    const urls: string[] = (product.images ?? [])
      .map((image: { url?: string | null } | null) => image?.url)
      .filter((url: string | null | undefined): url is string => !!url)

    let thumbnail: string | null = product.thumbnail || null
    let nextUrls = urls

    if (!thumbnail && urls.length) {
      thumbnail = urls[0]
    } else if (thumbnail && !urls.includes(thumbnail)) {
      nextUrls = [thumbnail, ...urls]
    }

    const thumbnailChanged = thumbnail !== (product.thumbnail || null)
    const imagesChanged = nextUrls.length !== urls.length
    if (!thumbnailChanged && !imagesChanged) return

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id },
        update: {
          ...(thumbnailChanged ? { thumbnail } : {}),
          ...(imagesChanged
            ? { images: nextUrls.map((url) => ({ url })) }
            : {}),
        },
      },
    })
    logger.info(`[images] Товар ${id}: фото синхронизированы`)
  } catch (e) {
    logger.warn(`[images] Не удалось синхронизировать фото ${id}: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
