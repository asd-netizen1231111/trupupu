import { Metadata } from "next"
import Image from "next/image"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import FlowingLines from "@modules/common/components/flowing-lines"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

// Плавные (ease) маски: 1/3 = 33.33%, 2/3 = 66.67%
const SHARP_GRADIENT =
  "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 33.33%, rgba(0,0,0,0.84) 41.67%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.16) 58.33%, rgba(0,0,0,0) 66.67%)"

// Размытый слой: проявляется во 2-й трети, держится в 3-й, у самого края мягко растворяется
const BLUR_GRADIENT =
  "linear-gradient(to right, rgba(0,0,0,0) 33.33%, rgba(0,0,0,0.16) 41.67%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.84) 58.33%, rgba(0,0,0,1) 66.67%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)"

const SHARP_MASK: React.CSSProperties = {
  maskImage: SHARP_GRADIENT,
  WebkitMaskImage: SHARP_GRADIENT,
}

const BLUR_MASK: React.CSSProperties = {
  maskImage: BLUR_GRADIENT,
  WebkitMaskImage: BLUR_GRADIENT,
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <div
        className="relative overflow-x-clip"
        style={
          {
            // Ширина фото уменьшена на 20% (было clamp(330px, 30vw, 540px))
            "--banner-w": "clamp(264px, 24vw, 432px)",
            // Общий сдвиг фото и страницы влево: 15% ширины фото
            "--shift": "calc(var(--banner-w) * 0.15)",
          } as React.CSSProperties
        }
      >
        {/*
          Боковое фото (только десктоп), от верха страницы до линии над подвалом.
          Делим слева направо на 3 части:
            1/3 — чёткая, 2/3 — плавный переход в размытие, 3/3 — размытая под сайтом.
          Сайт сдвинут на 2/3 ширины фото и ложится на размытую часть.
        */}
        <aside
          aria-hidden="true"
          className="hidden small:block absolute inset-y-0 left-[calc(var(--shift)*-1)] w-[var(--banner-w)] pointer-events-none"
        >
          <div className="sticky top-0 h-screen w-full">
            {/* Чёткий слой: виден в 1-й трети, плавно исчезает во 2-й */}
            <div className="absolute inset-0" style={SHARP_MASK}>
              <Image
                src="/images/side-banner.png"
                alt=""
                fill
                priority
                sizes="432px"
                className="object-cover object-center"
              />
            </div>
            {/* Размытый слой: проявляется во 2-й трети, полностью размыт в 3-й */}
            <div className="absolute inset-0 overflow-hidden" style={BLUR_MASK}>
              <Image
                src="/images/side-banner.png"
                alt=""
                fill
                sizes="432px"
                className="object-cover object-center scale-110 blur-2xl"
              />
            </div>
          </div>
        </aside>

        {/*
          Анимированные линии: под интерфейсом, над фото. Шапка (z-50) и подвал
          (вне этого блока) их не затрагивают. Слой «прилипает» к экрану.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none"
        >
          <div className="sticky top-0 h-screen w-full">
            <FlowingLines interactive lines={8} opacity={0.35} />
          </div>
        </div>

        {/* Шапка на всю ширину, от самого левого края, поверх фото */}
        <Nav />

        <div className="relative z-10 min-w-0 small:ml-[calc(var(--banner-w)*2/3-var(--shift))]">
          {customer && cart && (
            <CartMismatchBanner customer={customer} cart={cart} />
          )}

          {cart && (
            <FreeShippingPriceNudge
              variant="popup"
              cart={cart}
              shippingOptions={shippingOptions}
            />
          )}
          {props.children}
        </div>
      </div>
      <Footer />
    </>
  )
}
