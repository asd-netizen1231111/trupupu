import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type CustomerRow = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

type ProductRow = {
  id: string
  title?: string | null
  handle?: string | null
}

type ReviewRow = {
  id: string
  product_id: string
  customer_id: string
  rating: number
  text: string
  status: string
  created_at: Date | string
  updated_at: Date | string
}

async function loadCustomers(
  scope: MedusaContainer,
  ids: string[]
): Promise<Map<string, CustomerRow>> {
  const map = new Map<string, CustomerRow>()
  if (!ids.length) {
    return map
  }
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id: ids },
  })
  for (const c of data as CustomerRow[]) {
    map.set(c.id, c)
  }
  return map
}

async function loadProducts(
  scope: MedusaContainer,
  ids: string[]
): Promise<Map<string, ProductRow>> {
  const map = new Map<string, ProductRow>()
  if (!ids.length) {
    return map
  }
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
    filters: { id: ids },
  })
  for (const p of data as ProductRow[]) {
    map.set(p.id, p)
  }
  return map
}

function fullName(c?: CustomerRow) {
  if (!c) {
    return ""
  }
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim()
}

/** Публичное имя: только имя и первая буква фамилии, без email. */
function publicName(c?: CustomerRow) {
  const first = c?.first_name?.trim()
  const last = c?.last_name?.trim()
  if (!first) {
    return "Покупатель"
  }
  return last ? `${first} ${last.charAt(0)}.` : first
}

/** Служебный product_id для отзывов о работе магазина (не о товаре). */
export const STORE_REVIEW_PRODUCT_ID = "store"

/** Отзывы для витрины: без customer_id и email. */
export async function toPublicReviews(
  scope: MedusaContainer,
  reviews: ReviewRow[],
  options: { withProducts?: boolean } = {}
) {
  const [customers, products] = await Promise.all([
    loadCustomers(
      scope,
      Array.from(new Set(reviews.map((r) => r.customer_id)))
    ),
    options.withProducts
      ? loadProducts(
          scope,
          Array.from(
            new Set(
              reviews
                .map((r) => r.product_id)
                .filter((id) => id !== STORE_REVIEW_PRODUCT_ID)
            )
          )
        )
      : Promise.resolve(new Map<string, ProductRow>()),
  ])
  return reviews.map((r) => {
    const p = products.get(r.product_id)
    return {
      id: r.id,
      product_id: r.product_id,
      rating: r.rating,
      text: r.text,
      created_at: r.created_at,
      author_name: publicName(customers.get(r.customer_id)),
      ...(options.withProducts
        ? {
            is_store_review: r.product_id === STORE_REVIEW_PRODUCT_ID,
            product_title: p?.title ?? null,
            product_handle: p?.handle ?? null,
          }
        : {}),
    }
  })
}

/** Отзывы для админки: с именем, email клиента и названием товара. */
export async function toAdminReviews(
  scope: MedusaContainer,
  reviews: ReviewRow[]
) {
  const [customers, products] = await Promise.all([
    loadCustomers(
      scope,
      Array.from(new Set(reviews.map((r) => r.customer_id)))
    ),
    loadProducts(
      scope,
      Array.from(
        new Set(
          reviews
            .map((r) => r.product_id)
            .filter((id) => id !== STORE_REVIEW_PRODUCT_ID)
        )
      )
    ),
  ])
  return reviews.map((r) => {
    const c = customers.get(r.customer_id)
    const p = products.get(r.product_id)
    return {
      ...r,
      customer_name: fullName(c) || c?.email || "Покупатель",
      customer_email: c?.email ?? null,
      product_title:
        r.product_id === STORE_REVIEW_PRODUCT_ID
          ? "Отзыв о магазине"
          : (p?.title ?? "Товар удалён"),
      product_handle: p?.handle ?? null,
    }
  })
}
