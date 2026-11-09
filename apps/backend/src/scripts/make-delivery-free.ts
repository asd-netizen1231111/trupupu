/**
 * Делает доставку по Беларуси бесплатной: удаляет все способы доставки и
 * создаёт один «Бесплатная доставка» (0 BYN) в зоне «Беларусь».
 * Повторный запуск безопасен.
 *
 *   npx medusa exec ./src/scripts/make-delivery-free.ts
 */
import {
  createShippingOptionsWorkflow,
  deleteShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const COUNTRY = "by"
const CURRENCY = "byn"
const NAME = "Бесплатная доставка"

export default async function makeDeliveryFree({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const region = regions.find((r) => r.currency_code === CURRENCY)

  const { data: zones } = await query.graph({
    entity: "service_zone",
    fields: ["id", "name", "geo_zones.country_code"],
  })
  const byZone = zones.find((z) =>
    (z.geo_zones ?? []).some((g) => g?.country_code === COUNTRY)
  )
  if (!byZone) {
    throw new Error("Нет зоны доставки «Беларусь». Сначала запустите setup-belarus.ts")
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id", "prices.amount"],
  })

  const alreadyOk =
    options.length === 1 &&
    options[0].name === NAME &&
    options[0].service_zone_id === byZone.id &&
    (
      ((options[0] as unknown as { prices?: { amount?: number }[] }).prices) ?? []
    ).every((p) => p?.amount === 0)

  if (alreadyOk) {
    logger.info("Бесплатная доставка уже настроена.")
    return
  }

  if (options.length) {
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: options.map((o) => o.id) },
    })
    logger.info(`Удалены способы доставки: ${options.map((o) => o.name).join(", ")}`)
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: NAME,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: byZone.id,
        shipping_profile_id: profiles[0].id,
        type: { label: NAME, description: "Бесплатно", code: "standard" },
        prices: [
          { currency_code: CURRENCY, amount: 0 },
          ...(region ? [{ region_id: region.id, amount: 0 }] : []),
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  logger.info(`Создан способ «${NAME}» (0 BYN) в зоне «${byZone.name}»`)
  logger.info("Готово.")
}
