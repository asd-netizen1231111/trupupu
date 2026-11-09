import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"
import SiteSettingsModuleService from "../../../modules/site-settings/service"
import { revalidateStorefront } from "../../../lib/revalidate-storefront"
import { PostAdminSiteSettingsType } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const site_settings = await service.getSettings()
  res.json({ site_settings })
}

export async function POST(
  req: MedusaRequest<PostAdminSiteSettingsType>,
  res: MedusaResponse
) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const site_settings = await service.upsertSettings(req.validatedBody)

  // сразу обновляем шапку, подвал, доставку, оплату, контакты на витрине
  await revalidateStorefront(
    ["site-settings"],
    req.scope.resolve("logger")
  )

  res.json({ site_settings })
}
