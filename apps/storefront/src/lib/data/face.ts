import "server-only"

import { sdk } from "@lib/config"

export type FaceTop = {
  badge: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export type FaceBottomItem = {
  id: string
  badge: string
  title: string
  text: string
  link: string
}

export type Face = {
  top: FaceTop
  bottom: {
    heading: string
    items: FaceBottomItem[]
  }
}

const FALLBACK: Face = {
  top: {
    badge: "Акции недели",
    title: "Скидки до 30% на бытовую технику для дома",
    description:
      "Обновите кухню и сделайте уборку проще — выгодные предложения только до конца недели.",
    button_text: "Смотреть акции",
    button_link: "/catalog",
  },
  bottom: {
    heading: "Скидки и спецпредложения",
    items: [
      { id: "1", badge: "−20%", title: "−20% на пылесосы", text: "Роботы и вертикальные модели", link: "/catalog" },
      { id: "2", badge: "−15%", title: "Кухня мечты", text: "Блендеры, кофемашины, мультиварки", link: "/catalog" },
      { id: "3", badge: "−25%", title: "Тёплый дом", text: "Обогреватели и увлажнители", link: "/catalog" },
      { id: "4", badge: "0 BYN", title: "Бесплатная доставка", text: "При заказе от 300 BYN по Беларуси", link: "/catalog" },
    ],
  },
}

/**
 * Блоки главной страницы из раздела «FACE» в админке.
 * Тег "face" сбрасывается после сохранения в админке.
 */
export const getFace = async (): Promise<Face> => {
  try {
    const { face } = await sdk.client.fetch<{ face: Face }>("/store/face", {
      next: { revalidate: 60, tags: ["face"] },
      cache: "force-cache",
    })
    return face ?? FALLBACK
  } catch {
    return FALLBACK
  }
}
