import { MedusaService } from "@medusajs/framework/utils"
import SiteSettings from "./models/site-settings"
import { Face, mergeFace } from "./face"

export const DEFAULT_SITE_SETTINGS = {
  phone: "+375111111111",
  work_hours: "Пн–Вс: 9:00–21:00",
  legal_name: "ООО «Добрая Хата»",
  unp: "000000000",
  address: "г. Минск, ул. Примерная, 1",
  email: "info@example.by",
  bank_name: "",
  bank_account: "",
  socials: {
    instagram: "",
    telegram: "",
    viber: "",
    vk: "",
  } as Record<string, string>,
}

export type SiteSettingsInput = Partial<typeof DEFAULT_SITE_SETTINGS>

class SiteSettingsModuleService extends MedusaService({
  SiteSettings,
}) {
  /** Возвращает единственную запись настроек, создаёт её при первом обращении. */
  async getSettings() {
    const [existing] = await this.listSiteSettings({}, { take: 1 })
    if (existing) {
      return existing
    }
    return await this.createSiteSettings(DEFAULT_SITE_SETTINGS)
  }

  async upsertSettings(data: SiteSettingsInput) {
    const current = await this.getSettings()
    return await this.updateSiteSettings({ id: current.id, ...data })
  }

  /** Блоки главной страницы (FACE) с учётом значений по умолчанию. */
  async getFace(): Promise<Face> {
    const current = await this.getSettings()
    return mergeFace((current as { face?: unknown }).face)
  }

  async saveFace(face: Face): Promise<Face> {
    const current = await this.getSettings()
    await this.updateSiteSettings({
      id: current.id,
      face: face as unknown as Record<string, unknown>,
    })
    return face
  }
}

export default SiteSettingsModuleService
