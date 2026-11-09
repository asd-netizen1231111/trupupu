/**
 * Настройка магазина «Добрая Хата»: регион Беларусь (BYN), доставка,
 * налоговый регион и 10 категорий. Удаляет демо-регион Europe и демо-категории.
 * Повторный запуск безопасен.
 *
 *   npx medusa exec ./src/scripts/setup-belarus.ts
 */
import {
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const COUNTRY = "by"
const CURRENCY = "byn"

const CATEGORIES = [
  { name: "Крупная бытовая техника", handle: "krupnaya-tehnika" },
  { name: "Кухонная техника", handle: "kuhonnaya-tehnika" },
  { name: "Климатическая техника", handle: "klimaticheskaya-tehnika" },
  { name: "Техника для уборки", handle: "tehnika-dlya-uborki" },
  { name: "Уход за одеждой", handle: "uhod-za-odezhdoy" },
  { name: "Красота и здоровье", handle: "krasota-i-zdorovie" },
  { name: "Посуда и кухонные принадлежности", handle: "posuda" },
  { name: "Освещение", handle: "osveschenie" },
  { name: "Текстиль для дома", handle: "tekstil" },
  { name: "Хранение и порядок", handle: "hranenie" },
]

const DEMO_CATEGORY_HANDLES = ["shirts", "sweatshirts", "pants", "merch"]

export default async function setupBelarus({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const pricing = container.resolve(Modules.PRICING)

  // ---- Регион «Беларусь» ---------------------------------------------------
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })

  let region = regions.find((r) => r.currency_code === CURRENCY)

  const otherRegions = regions.filter((r) => r.id !== region?.id)
  if (otherRegions.length) {
    await deleteRegionsWorkflow(container).run({
      input: { ids: otherRegions.map((r) => r.id) },
    })
    logger.info(`Удалены регионы: ${otherRegions.map((r) => r.name).join(", ")}`)
  }

  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Беларусь",
            currency_code: CURRENCY,
            countries: [COUNTRY],
            payment_providers: ["pp_system_default"],
            automatic_taxes: true,
          },
        ],
      },
    })
    region = result[0] as any
    logger.info("Создан регион «Беларусь» (BYN)")
  }

  // ---- Магазин: валюта BYN по умолчанию -----------------------------------
  const { data: stores } = await query.graph({ entity: "store", fields: ["id"] })
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: stores[0].id },
      update: {
        name: "Добрая Хата",
        supported_currencies: [{ currency_code: CURRENCY, is_default: true }],
        default_region_id: region!.id,
      },
    },
  })
  logger.info("Магазин: валюта BYN, регион по умолчанию — Беларусь")

  // ---- Налоговый регион -----------------------------------------------------
  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  if (!taxRegions.some((t) => t.country_code === COUNTRY)) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: COUNTRY, provider_id: "tp_system" }],
    })
    logger.info("Создан налоговый регион BY")
  }

  // ---- Доставка по Беларуси ----------------------------------------------
  const { data: zones } = await query.graph({
    entity: "service_zone",
    fields: ["id", "name", "fulfillment_set_id", "geo_zones.country_code"],
  })

  let byZone = zones.find((z) =>
    (z.geo_zones ?? []).some((g) => g?.country_code === COUNTRY)
  )

  if (!byZone) {
    const fulfillmentSetId = zones[0]?.fulfillment_set_id
    if (!fulfillmentSetId) {
      throw new Error("Не найден набор доставки (fulfillment set)")
    }
    byZone = (await fulfillment.createServiceZones({
      name: "Беларусь",
      fulfillment_set_id: fulfillmentSetId,
      geo_zones: [{ type: "country", country_code: COUNTRY }],
    })) as any
    logger.info("Создана зона доставки «Беларусь»")
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "service_zone_id"],
  })

  if (!options.some((o) => o.service_zone_id === byZone!.id)) {
    const { data: profiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    })

    const make = (name: string, code: string, description: string, amount: number) => ({
      name,
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: byZone!.id,
      shipping_profile_id: profiles[0].id,
      type: { label: name, description, code },
      prices: [
        { currency_code: CURRENCY, amount },
        { region_id: region!.id, amount },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    })

    await createShippingOptionsWorkflow(container).run({
      input: [
        make("Бесплатная доставка", "standard", "Бесплатно", 0),
      ],
    })
    logger.info("Созданы способы доставки по Беларуси")
  }

  // ---- Цены BYN для существующих товаров ---------------------------------
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "price_set.id", "price_set.prices.currency_code", "price_set.prices.amount"],
  })

  let priced = 0
  for (const v of variants) {
    const priceSet = (v as any).price_set
    if (!priceSet?.id) continue
    const prices = priceSet.prices ?? []
    if (prices.some((p: any) => p.currency_code === CURRENCY)) continue
    const base = prices.find((p: any) => p.currency_code === "eur")?.amount ?? 50
    await pricing.addPrices({
      priceSetId: priceSet.id,
      prices: [{ currency_code: CURRENCY, amount: Math.round(Number(base) * 3.5) }],
    })
    priced++
  }
  if (priced) logger.info(`Добавлены цены BYN для ${priced} вариант(ов)`)

  // ---- Категории -----------------------------------------------------------
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })

  const demo = categories.filter((c) => DEMO_CATEGORY_HANDLES.includes(c.handle))
  if (demo.length) {
    await deleteProductCategoriesWorkflow(container).run({
      input: demo.map((c) => c.id),
    })
    logger.info(`Удалены демо-категории: ${demo.length}`)
  }

  const missing = CATEGORIES.filter(
    (c) => !categories.some((e) => e.handle === c.handle)
  )
  if (missing.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missing.map((c, i) => ({
          ...c,
          is_active: true,
          is_internal: false,
          rank: i,
        })),
      },
    })
    logger.info(`Создано категорий: ${missing.length}`)
  }

  logger.info("Готово.")
}
