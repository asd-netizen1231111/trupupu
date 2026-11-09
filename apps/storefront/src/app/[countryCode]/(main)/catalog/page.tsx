import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { getSiteOrigin, siteUrl, STORE_NAME } from "@lib/util/site"
import StoreTemplate from "@modules/store/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const origin = await getSiteOrigin()
  return {
    title: "Каталог товаров",
    description: `Весь каталог бытовой техники и товаров для дома в магазине ${STORE_NAME}. Фильтры по категориям и цене, доставка по Беларуси.`,
    alternates: { canonical: siteUrl(origin, countryCode, "/catalog") },
  }
}

export default async function CatalogPage(props: Props) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return <StoreTemplate currencyCode={region.currency_code} />
}
