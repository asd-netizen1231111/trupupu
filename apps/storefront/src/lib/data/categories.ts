import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

/**
 * Кэш категорий: тег "categories" сбрасывается из админки (см. /api/revalidate),
 * а revalidate — страховка на случай, если вебхук не дошёл.
 */
const categoriesNext = async () => {
  const opts = await getCacheOptions("categories")
  return {
    revalidate: 30,
    tags: ["categories", ...(("tags" in opts && opts.tags) || [])],
  }
}

export const listCategories = async (query?: Record<string, unknown>) => {
  const next = await categoriesNext()

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = await categoriesNext()

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields:
            "id,name,handle,description,+metadata,*category_children,*parent_category,*parent_category.parent_category",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
