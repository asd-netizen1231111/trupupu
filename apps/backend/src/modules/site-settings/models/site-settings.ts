import { model } from "@medusajs/framework/utils"

// Одна запись с настройками сайта (контакты для шапки и подвала)
const SiteSettings = model.define("site_settings", {
  id: model.id({ prefix: "sset" }).primaryKey(),
  phone: model.text().nullable(),
  work_hours: model.text().nullable(),
  legal_name: model.text().nullable(),
  unp: model.text().nullable(),
  address: model.text().nullable(),
  email: model.text().nullable(),
  bank_name: model.text().nullable(),
  bank_account: model.text().nullable(),
  // { instagram?: string, telegram?: string, viber?: string, vk?: string, ... }
  socials: model.json().nullable(),
  // Блоки главной страницы (FACE): { top: {...}, bottom: {...} }
  face: model.json().nullable(),
})

export default SiteSettings
