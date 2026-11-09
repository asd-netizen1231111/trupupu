import { z } from "zod"

export const PostAdminFace = z.object({
  top: z.object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    button_text: z.string(),
    button_link: z.string(),
  }),
  bottom: z.object({
    heading: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        badge: z.string(),
        title: z.string(),
        text: z.string(),
        link: z.string(),
      })
    ),
  }),
})

export type PostAdminFaceType = z.infer<typeof PostAdminFace>
