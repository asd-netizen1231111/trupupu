import { Metadata } from "next"

import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { getSiteOrigin, siteUrl, STORE_NAME } from "@lib/util/site"

type Props = { params: Promise<{ countryCode: string }> }

export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const origin = await getSiteOrigin()
  return {
    title: "Контакты",
    description: `Телефон, адрес, режим работы и реквизиты интернет-магазина ${STORE_NAME}.`,
    alternates: { canonical: siteUrl(origin, countryCode, "/contact") },
  }
}

export default async function ContactPage() {
  const s = await getSiteSettings()

  const rows: [string, React.ReactNode][] = [
    ["Телефон", s.phone && <a href={phoneHref(s.phone)} className="font-semibold hover:underline">{s.phone}</a>],
    ["Режим работы", s.work_hours],
    ["Email", s.email && <a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a>],
    ["Адрес", s.address],
    ["Юридическое лицо", s.legal_name],
    ["УНП", s.unp],
  ]

  return (
    <div className="content-container py-10 small:py-14 max-w-3xl" data-testid="contact-page">
      <h1 className="text-2xl-semi mb-8">Контакты</h1>
      <dl className="grid grid-cols-1 xsmall:grid-cols-[200px_1fr] gap-x-6 gap-y-4 text-base-regular">
        {rows
          .filter(([, v]) => !!v)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-ui-fg-subtle">{label}</dt>
              <dd className="whitespace-pre-line">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  )
}
