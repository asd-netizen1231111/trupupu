const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["ru"], { type: "region" })
    : null

/** Название страны по-русски по коду ISO-2: "by" -> "Беларусь" */
export const countryNameRu = (code?: string | null, fallback?: string) => {
  if (!code) {
    return fallback ?? ""
  }

  try {
    return regionNames?.of(code.toUpperCase()) ?? fallback ?? code.toUpperCase()
  } catch {
    return fallback ?? code.toUpperCase()
  }
}
