"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    ...(product.description
      ? [
          {
            label: "Описание",
            component: <DescriptionTab product={product} />,
          },
        ]
      : []),
    {
      label: "Характеристики",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Доставка и гарантия",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={[tabs[0].label]}>
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({ product }: ProductTabsProps) => (
  <div
    className="text-base-regular py-6 whitespace-pre-line text-ui-fg-base"
    data-testid="product-description"
  >
    {product.description}
  </div>
)

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex justify-between gap-4 border-b border-ui-border-base py-2">
      <dt className="text-ui-fg-subtle">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  ) : null

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const dims =
    product.length && product.width && product.height
      ? `${product.length} × ${product.width} × ${product.height} мм`
      : null

  const rows = [
    { label: "Тип", value: product.type?.value },
    { label: "Материал", value: product.material },
    { label: "Страна производства", value: product.origin_country?.toUpperCase() },
    { label: "Вес", value: product.weight ? `${product.weight} г` : null },
    { label: "Габариты (Д × Ш × В)", value: dims },
  ].filter((r) => r.value)

  return (
    <div className="text-small-regular py-6">
      {rows.length ? (
        <dl>
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </dl>
      ) : (
        <p className="text-ui-fg-subtle">Характеристики уточняйте у менеджера.</p>
      )}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-6">
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Доставка по Беларуси</span>
            <p className="max-w-sm">
              Стоимость и сроки зависят от способа доставки.{" "}
              <LocalizedClientLink href="/delivery" className="underline">
                Подробнее
              </LocalizedClientLink>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Официальная гарантия</span>
            <p className="max-w-sm">
              На всю технику действует гарантия производителя.{" "}
              <LocalizedClientLink href="/warranty" className="underline">
                Условия гарантии
              </LocalizedClientLink>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Удобная оплата</span>
            <p className="max-w-sm">
              Наличными, картой или онлайн.{" "}
              <LocalizedClientLink href="/payment" className="underline">
                Способы оплаты
              </LocalizedClientLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
