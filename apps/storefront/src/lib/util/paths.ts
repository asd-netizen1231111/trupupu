/**
 * Регион у магазина один, поэтому код страны (/by) в адресах не показываем:
 * /catalog/mebel, /product/divan-milan. Внутри Next маршруты по-прежнему
 * лежат в app/[countryCode], middleware делает rewrite на /by/...
 * Для других стран (если появятся) префикс сохраняется: /ru/catalog.
 */
export const DEFAULT_COUNTRY = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "by"
).toLowerCase()

export const countryPrefix = (countryCode?: string | string[] | null) => {
  const cc = (Array.isArray(countryCode) ? countryCode[0] : countryCode)
    ?.toLowerCase()
  return !cc || cc === DEFAULT_COUNTRY ? "" : `/${cc}`
}

/** localizePath("by", "/catalog") -> "/catalog"; localizePath("ru", "/catalog") -> "/ru/catalog" */
export const localizePath = (
  countryCode: string | string[] | null | undefined,
  path = "/"
) => {
  const prefix = countryPrefix(countryCode)
  const p = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  return `${prefix}${p}` || "/"
}

/** Убирает префикс страны из пути браузера: "/ru/catalog" -> "/catalog" */
export const stripCountry = (
  pathname: string,
  countryCode?: string | string[] | null
) => {
  const cc = (Array.isArray(countryCode) ? countryCode[0] : countryCode)
    ?.toLowerCase()
  if (cc && (pathname === `/${cc}` || pathname.startsWith(`/${cc}/`))) {
    return pathname.slice(cc.length + 1) || "/"
  }
  return pathname
}
