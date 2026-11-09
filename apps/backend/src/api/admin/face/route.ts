import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"
import SiteSettingsModuleService from "../../../modules/site-settings/service"
import { revalidateStorefront } from "../../../lib/revalidate-storefront"
import { PostAdminFaceType } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const face = await service.getFace()
  res.json({ face })
}

export async function POST(
  req: MedusaRequest<PostAdminFaceType>,
  res: MedusaResponse
) {
  const service: SiteSettingsModuleService =
    req.scope.resolve(SITE_SETTINGS_MODULE)
  const face = await service.saveFace(req.validatedBody)

  await revalidateStorefront(["face"], req.scope.resolve("logger"))

  res.json({ face })
}
