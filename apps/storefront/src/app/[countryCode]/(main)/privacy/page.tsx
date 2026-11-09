import { Metadata } from "next"

import { INFO_PAGES } from "@lib/content/info-pages"
import { InfoPageView, infoPageMetadata } from "@modules/policies/templates/info-page"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return infoPageMetadata("privacy", countryCode)
}

export default function PrivacyPage() {
  return <InfoPageView page={INFO_PAGES.privacy} />
}
