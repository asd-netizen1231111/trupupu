import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import PopularCategories from "@modules/home/components/popular-categories"
import Promotions from "@modules/home/components/promotions"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import {
  getSiteOrigin,
  listCountryCodes,
  siteUrl,
  STORE_DESCRIPTION,
  STORE_NAME,
} from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: { absolute: `${STORE_NAME} — бытовая техника для дома` },
    description: STORE_DESCRIPTION,

    alternates: {
      canonical: siteUrl(origin, countryCode),
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `ru-${code.toUpperCase()}`,
            siteUrl(origin, code),
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  }).catch(() => ({ collections: [] }))

  if (!region) {
    return null
  }

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = siteUrl(origin, countryCode)
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero />
      <Promotions />
      <PopularCategories />
      {!!collections?.length && (
        <div className="py-12">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      )}
    </>
  )
}
