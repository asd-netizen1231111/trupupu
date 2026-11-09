import { getBaseURL } from "@lib/util/env"
import { STORE_DESCRIPTION, STORE_NAME } from "@lib/util/site"
import { Metadata, Viewport } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  // На каждой странице: "<Заголовок страницы> | Добрая Хата"
  title: {
    default: `${STORE_NAME} — бытовая техника для дома`,
    template: `%s | ${STORE_NAME}`,
  },
  description: STORE_DESCRIPTION,
  applicationName: STORE_NAME,
  openGraph: {
    type: "website",
    locale: "ru_BY",
    siteName: STORE_NAME,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
