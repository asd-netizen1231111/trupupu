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

export type FaceBottom = {
  heading: string
  items: FaceBottomItem[]
}

export type Face = {
  top: FaceTop
  bottom: FaceBottom
}

export const DEFAULT_FACE: Face = {
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
      {
        id: "default-1",
        badge: "−20%",
        title: "−20% на пылесосы",
        text: "Роботы и вертикальные модели",
        link: "/catalog",
      },
      {
        id: "default-2",
        badge: "−15%",
        title: "Кухня мечты",
        text: "Блендеры, кофемашины, мультиварки",
        link: "/catalog",
      },
      {
        id: "default-3",
        badge: "−25%",
        title: "Тёплый дом",
        text: "Обогреватели и увлажнители",
        link: "/catalog",
      },
      {
        id: "default-4",
        badge: "0 BYN",
        title: "Бесплатная доставка",
        text: "При заказе от 300 BYN по Беларуси",
        link: "/catalog",
      },
    ],
  },
}

/** Накладывает сохранённые данные на значения по умолчанию. */
export const mergeFace = (saved: unknown): Face => {
  const s = (saved ?? {}) as Partial<Face>
  return {
    top: { ...DEFAULT_FACE.top, ...(s.top ?? {}) },
    bottom: {
      heading: s.bottom?.heading ?? DEFAULT_FACE.bottom.heading,
      // если список сохранён (даже пустой) — берём его, иначе значения по умолчанию
      items: Array.isArray(s.bottom?.items)
        ? s.bottom.items
        : DEFAULT_FACE.bottom.items,
    },
  }
}
