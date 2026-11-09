import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"
import SiteSettingsModuleService from "../../../modules/site-settings/service"

// Публичные блоки главной страницы (акции недели и спецпредложения)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const face = await service.getFace()
  res.json({ face })
}
