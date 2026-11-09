import "server-only"

import { sdk } from "@lib/config"

export type SiteSettings = {
  phone: string | null
  work_hours: string | null
  legal_name: string | null
  unp: string | null
  address: string | null
  email: string | null
  bank_name: string | null
  bank_account: string | null
  socials: Record<string, string>
}

const FALLBACK: SiteSettings = {
  phone: "+375111111111",
  work_hours: null,
  legal_name: null,
  unp: null,
  address: null,
  email: null,
  bank_name: null,
  bank_account: null,
  socials: {},
}

/**
 * Контакты из раздела «Настройки сайта» в админке.
 * Кэш 60 сек: после сохранения в админке витрина обновится в течение минуты.
 */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const { site_settings } = await sdk.client.fetch<{
      site_settings: SiteSettings
    }>("/store/site-settings", {
      next: { revalidate: 60, tags: ["site-settings"] },
      cache: "force-cache",
    })
    return { ...FALLBACK, ...site_settings, socials: site_settings.socials ?? {} }
  } catch {
    return FALLBACK
  }
}

/** "+375 (29) 111-11-11" -> "+375291111111" для ссылки tel: */
export const phoneHref = (phone?: string | null) =>
  phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined
