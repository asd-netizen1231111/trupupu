import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * Вызывается бэкендом (Medusa) при изменении категорий/товаров/настроек.
 * POST /api/revalidate?secret=...&tags=categories,products
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const tags = (req.nextUrl.searchParams.get("tags") ?? "categories")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 })
  }
  // шапка и подвал находятся в layout — сбрасываем кэш страниц целиком
  revalidatePath("/", "layout")

  return NextResponse.json({ ok: true, tags })
}
