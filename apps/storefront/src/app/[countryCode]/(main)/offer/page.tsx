import { Metadata } from "next"

import { INFO_PAGES, InfoPage } from "@lib/content/info-pages"
import { getSiteSettings, SiteSettings } from "@lib/data/site-settings"
import { STORE_NAME } from "@lib/util/site"
import { InfoPageView, infoPageMetadata } from "@modules/policies/templates/info-page"

type Props = { params: Promise<{ countryCode: string }> }

// Реквизиты берутся из «Настроек сайта» (как и подвал), поэтому ревалидация
// такая же, как у запроса настроек: изменения из админки видны в течение минуты.
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return infoPageMetadata("offer", countryCode)
}

/** Те же данные, что в подвале («Добрая Хата»), но одной строкой. */
const buildRequisites = (s: SiteSettings): string | null => {
  const clean = (v?: string | null) =>
    (v ?? "").replace(/\s*\n\s*/g, ", ").trim()

  const parts = [
    clean(s.legal_name),
    clean(s.unp) && `УНП ${clean(s.unp)}`,
    clean(s.address) && `Юр. адрес: ${clean(s.address)}`,
    clean(s.bank_name),
    clean(s.bank_account) && `Р/с ${clean(s.bank_account)}`,
  ].filter(Boolean) as string[]

  if (!parts.length) return null
  return `**${STORE_NAME}**; ${parts.join("; ")}.`
}

/** Пункт «Владелец интернет-магазина, Продавец» — юр. лицо, УНП и юр. адрес из админки. */
const buildOwnerItem = (s: SiteSettings): string => {
  const clean = (v?: string | null) =>
    (v ?? "").replace(/\s*\n\s*/g, ", ").trim()

  const parts = [
    clean(s.legal_name),
    clean(s.unp) && `УНП ${clean(s.unp)}`,
    clean(s.address) && `юридический адрес: ${clean(s.address)}`,
  ].filter(Boolean) as string[]

  return `**Владелец интернет-магазина, Продавец** — ${
    parts.length ? parts.join(", ") : `«${STORE_NAME}»`
  }.`
}

export default async function OfferPage() {
  const s = await getSiteSettings()
  const requisites = buildRequisites(s)
  const ownerItem = buildOwnerItem(s)

  const page: InfoPage = {
    ...INFO_PAGES.offer,
    sections: INFO_PAGES.offer.sections.map((section) => {
      // Раздел 1: вставляем пункт о Владельце сразу после «Покупатель»
      if (section.heading?.startsWith("1.")) {
        return {
          ...section,
          blocks: section.blocks?.map((block) => {
            if (block.type !== "ul") return block
            const items = [...block.items]
            items.splice(1, 0, ownerItem)
            return { ...block, items }
          }),
        }
      }
      if (requisites && section.heading?.startsWith("12.")) {
        return { ...section, blocks: [{ type: "p" as const, text: requisites }] }
      }
      return section
    }),
  }

  return <InfoPageView page={page} />
}
