import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import { getSiteOrigin, siteUrl, STORE_NAME } from "@lib/util/site"
import CategoryTemplate from "@modules/categories/templates"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const category = await getCategoryByHandle(params.category).catch(() => null)

  if (!category) {
    notFound()
  }

  const origin = await getSiteOrigin()
  const url = siteUrl(
    origin,
    params.countryCode,
    `/catalog/${params.category.join("/")}`
  )
  const description =
    (category.metadata?.seo_description as string) ||
    category.description ||
    `${category.name} — купить в интернет-магазине ${STORE_NAME}. Доставка по Беларуси, гарантия, выгодные цены.`

  return {
    title: (category.metadata?.seo_title as string) || category.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${category.name} | ${STORE_NAME}`, description, url },
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params
  const [category, region] = await Promise.all([
    getCategoryByHandle(params.category).catch(() => null),
    getRegion(params.countryCode),
  ])

  if (!category || !region) {
    notFound()
  }

  return (
    <CategoryTemplate category={category} currencyCode={region.currency_code} />
  )
}
