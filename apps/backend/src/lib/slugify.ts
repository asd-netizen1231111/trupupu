// Транслитерация русских/белорусских названий в латинские слаги:
// "Диван Милан" -> "divan-milan"
const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // белорусские буквы
  і: "i", ў: "u",
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .split("")
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

/** true, если слаг уже латинский и «чистый» — тогда его не трогаем */
export const isCleanSlug = (handle?: string | null) =>
  !!handle && /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(handle)
