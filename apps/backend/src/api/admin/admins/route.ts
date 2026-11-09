import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createUsersWorkflow } from "@medusajs/medusa/core-flows"
import { PostAdminCreateAdminType } from "./validators"

const PROVIDER = "emailpass"

// Список всех администраторов
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email", "first_name", "last_name", "created_at"],
    pagination: { order: { created_at: "ASC" } },
  })

  res.json({
    admins: users,
    count: users.length,
    current_id: req.auth_context?.actor_id ?? null,
  })
}

// Новый админ: логин (email) + пароль
export async function POST(
  req: MedusaRequest<PostAdminCreateAdminType>,
  res: MedusaResponse
) {
  const { email, password, first_name, last_name } = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const authService = req.scope.resolve(Modules.AUTH)

  const { data: existing } = await query.graph({
    entity: "user",
    fields: ["id"],
    filters: { email },
  })
  if (existing.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Админ с таким логином уже существует"
    )
  }

  const { authIdentity, error } = await authService.register(PROVIDER, {
    body: { email, password },
  } as never)
  if (error || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "Не удалось создать учётные данные"
    )
  }

  let userId: string
  try {
    const { result } = await createUsersWorkflow(req.scope).run({
      input: { users: [{ email, first_name, last_name }] },
    })
    userId = result[0].id
    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { user_id: userId },
    })
  } catch (e) {
    // откат: не оставляем «висящие» учётные данные
    await authService.deleteAuthIdentities([authIdentity.id])
    throw e
  }

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email", "first_name", "last_name", "created_at"],
    filters: { id: userId },
  })

  res.status(201).json({ admin: users[0] })
}
