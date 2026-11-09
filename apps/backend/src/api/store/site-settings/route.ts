import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"
import SiteSettingsModuleService from "../../../modules/site-settings/service"

// Публичные данные для шапки и подвала витрины
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const s = await service.getSettings()
  res.json({
    site_settings: {
      phone: s.phone,
      work_hours: s.work_hours,
      legal_name: s.legal_name,
      unp: s.unp,
      address: s.address,
      email: s.email,
      bank_name: s.bank_name,
      bank_account: s.bank_account,
      socials: s.socials ?? {},
    },
  })
}
