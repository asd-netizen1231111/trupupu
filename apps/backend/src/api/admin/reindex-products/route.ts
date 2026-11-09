import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/** Ручное обновление каталога (кнопка в «Настройки сайта»). */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const search = req.scope.resolve(Modules.SEARCH)
  const result = await search.reindex({ index: "product", strategy: "in_place" })
  res.json(result)
}
