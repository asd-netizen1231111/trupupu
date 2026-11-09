import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "by"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const json = await response.json()

    const { regions } = json

    if (!regions?.length) {
      return new Map<string, HttpTypes.StoreRegion>()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Основная страна магазина (по умолчанию by). Не зависит от IP,
 * поэтому поисковики всегда получают одинаковый ответ.
 */
async function getCountryCode(
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  let countryCode

  if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION
  } else if (regionMap.keys().next().value) {
    countryCode = regionMap.keys().next().value
  }

  return countryCode
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(regionMap)

  const { pathname, search } = request.nextUrl
  const defaultCountry = (countryCode || DEFAULT_REGION).toLowerCase()
  const firstPathSegment = pathname.split("/")[1]?.toLowerCase()
  const urlHasCountry = !!firstPathSegment && regionMap.has(firstPathSegment)

  const withCookie = (response: NextResponse) => {
    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }
    return response
  }

  // Старые адреса с кодом основной страны (/by/catalog) -> /catalog.
  // Только для GET/HEAD, чтобы не ломать отправку форм.
  if (urlHasCountry && firstPathSegment === defaultCountry) {
    if (request.method === "GET" || request.method === "HEAD") {
      const rest = pathname.slice(defaultCountry.length + 1) || "/"
      return NextResponse.redirect(
        new URL(`${rest}${search}`, request.url),
        308
      )
    }
    return withCookie(NextResponse.next())
  }

  // Другая страна (если когда-нибудь добавится) — адрес с префиксом /ru/...
  if (urlHasCountry) {
    return withCookie(NextResponse.next())
  }

  // Основная страна: адрес без префикса, внутри rewrite на /by/...
  const target = new URL(
    `/${defaultCountry}${pathname === "/" ? "" : pathname}${search}`,
    request.url
  )
  return withCookie(NextResponse.rewrite(target))
}

export const config = {
  matcher: [
    "/((?!api|ucp|buy|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
