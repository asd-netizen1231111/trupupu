import { Metadata } from "next"

import { getSiteSettings, phoneHref } from "@lib/data/site-settings"
import { infoPageMetadata } from "@modules/policies/templates/info-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return infoPageMetadata("payment", countryCode)
}

const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

const CashIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </svg>
)

const CardIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </svg>
)

const PartnerCardIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M14 15l1.6 1.6L19 13.2" />
  </svg>
)

const WalletIcon = () => (
  <svg {...iconProps}>
    <path d="M3 7a2 2 0 0 1 2-2h12v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z" />
    <circle cx="16.5" cy="14.5" r="1.2" />
  </svg>
)

const HeartIcon = () => (
  <svg {...iconProps}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

const cards = [
  {
    icon: <CashIcon />,
    title: "Наличными при получении",
    text: "Самый привычный и спокойный способ. Курьер привозит заказ, вы не торопясь осматриваете товар, убеждаетесь, что всё в порядке, и только потом отдаёте деньги курьеру лично в руки.",
  },
  {
    icon: <CardIcon />,
    title: "Банковской картой",
    text: "Принимаем карты Visa, Mastercard и Белкарт. Быстро, безопасно и без лишних хлопот — просто выберите карту, которой вам удобнее всего пользоваться.",
  },
  {
    icon: <PartnerCardIcon />,
    title: "Картами рассрочки",
    text: "Также есть возможность оплаты картами рассрочки, такими как «Халва» или «Кактус».",
  },
]

export default async function PaymentPage() {
  const s = await getSiteSettings()
  return (
    <div className="content-container py-10 small:py-14" data-testid="policy-page">
      <nav
        aria-label="Хлебные крошки"
        className="mb-6 flex gap-2 text-small-regular text-ui-fg-subtle"
      >
        <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
          Главная
        </LocalizedClientLink>
        <span>/</span>
        <span>Оплата</span>
      </nav>

      {/* Hero */}
      <section className="rounded-2xl bg-ui-bg-subtle border border-ui-border-base px-6 py-10 small:px-12 small:py-14 text-center">
        <span className="inline-block rounded-full bg-ui-bg-base border border-ui-border-base px-4 py-1 text-small-semi text-ui-fg-subtle mb-5">
          Платите так, как вам удобно
        </span>
        <h1 className="text-3xl small:text-5xl font-semibold leading-tight mb-5">
          Удобные способы оплаты
        </h1>
        <p className="mx-auto max-w-2xl text-base-regular small:text-large-regular text-ui-fg-subtle">
          В «Доброй хате» мы хотим, чтобы покупка приносила только радость — а
          не заботы. Поэтому мы собрали для вас несколько простых и понятных
          способов оплаты. Выбирайте тот, который вам по душе.
        </p>
      </section>

      {/* Карточки */}
      <section className="mt-8 grid grid-cols-1 small:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-3 rounded-2xl border border-ui-border-base p-6 transition-shadow hover:shadow-elevation-card-hover"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
              {c.icon}
            </div>
            <h2 className="text-large-semi">{c.title}</h2>
            <p className="text-ui-fg-subtle">{c.text}</p>
          </div>
        ))}
      </section>

      {/* Главный акцент: оплата частями */}
      <section className="mt-8 flex flex-col small:flex-row items-start gap-5 rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ui-bg-base border border-ui-border-base">
          <WalletIcon />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl-semi">ОПЛАТА ЧАСТЯМИ</h2>
          <p className="text-ui-fg-subtle">
            Хотите обновить технику в доме, но не хочется отдавать всю сумму
            сразу? Мы вас понимаем! Оплачивайте покупку частями — комфортными
            платежами, которые не ударят по семейному бюджету.
          </p>
          <ul className="flex flex-col gap-2 text-ui-fg-base">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1">✓</span>
              <span>Оплата частями на срок от 6 до 60 месяцев</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1">✓</span>
              <span>Без первоначального взноса</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1">✓</span>
              <span>
                Возможность досрочного погашения — когда вам будет удобно
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Успокаивающий текст + CTA */}
      <section className="mt-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle">
          <HeartIcon />
        </div>
        <h2 className="text-2xl small:text-3xl font-semibold mb-3">
          Выбирайте самый удобный для вас способ
        </h2>
        <p className="mx-auto max-w-xl text-ui-fg-subtle mb-6">
          Мы всегда рады помочь! Если остались вопросы по оплате — позвоните
          нам по телефону{" "}
          {s.phone ? (
            <a
              href={phoneHref(s.phone)}
              className="font-semibold text-ui-fg-base hover:underline"
            >
              {s.phone}
            </a>
          ) : null}
          {s.work_hours ? ` (${s.work_hours})` : ""}. Мы с удовольствием всё
          расскажем и подскажем.
        </p>
        <LocalizedClientLink
          href="/catalog"
          className="inline-flex items-center justify-center rounded-full bg-ui-fg-base px-8 py-3 text-base-semi text-ui-bg-base hover:opacity-90 transition-opacity"
        >
          Перейти в каталог
        </LocalizedClientLink>
      </section>
    </div>
  )
}
