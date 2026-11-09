import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
} from '@medusajs/framework/http'
import { PostAdminSiteSettings } from './admin/site-settings/validators'
import { PostAdminFace } from './admin/face/validators'
import { PostAdminReviewStatus } from './admin/reviews/validators'
import { PostStoreReview } from './store/reviews/validators'
import {
  PostAdminCreateAdmin,
  PostAdminUpdateAdmin,
} from './admin/admins/validators'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/site-settings',
      middlewares: [validateAndTransformBody(PostAdminSiteSettings)],
    },
    {
      method: ['POST'],
      matcher: '/admin/face',
      middlewares: [validateAndTransformBody(PostAdminFace)],
    },
    {
      // создать отзыв может только вошедший покупатель
      method: ['POST'],
      matcher: '/store/reviews',
      middlewares: [
        authenticate('customer', ['session', 'bearer']),
        validateAndTransformBody(PostStoreReview),
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/reviews/:id',
      middlewares: [validateAndTransformBody(PostAdminReviewStatus)],
    },
    {
      method: ['POST'],
      matcher: '/admin/admins',
      middlewares: [validateAndTransformBody(PostAdminCreateAdmin)],
    },
    {
      method: ['POST'],
      matcher: '/admin/admins/:id',
      middlewares: [validateAndTransformBody(PostAdminUpdateAdmin)],
    },
  ],
})
