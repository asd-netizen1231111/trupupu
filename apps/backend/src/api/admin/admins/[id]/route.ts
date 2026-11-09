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
import {
  deleteUsersWorkflow,
  updateUsersWorkflow,
} from "@medusajs/medusa/core-flows"
import { PostAdminUpdateAdminType } from "../validators"

const PROVIDER = "emailpass"
const FIELDS = ["id", "email", "first_name", "last_name", "created_at"]

async function getUser(req: MedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "user",
    fields: FIELDS,
    filters: { id },
  })
  if (!data[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Админ не найден")
  }
  return data[0] as {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    created_at: string
  }
}

// Смена пароля и/или имени
export async function POST(
  req: MedusaRequest<PostAdminUpdateAdminType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { password, first_name, last_name } = req.validatedBody
  const user = await getUser(req, id)

  if (password) {
    const authService = req.scope.resolve(Modules.AUTH)
    const { success, error } = await authService.updateProvider(PROVIDER, {
      entity_id: user.email,
      password,
    })
    if (!success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "Не удалось сменить пароль"
      )
    }
  }

  if (first_name !== undefined || last_name !== undefined) {
    await updateUsersWorkflow(req.scope).run({
      input: { updates: [{ id, first_name, last_name }] },
    })
  }

  res.json({ admin: await getUser(req, id) })
}

// Удаление админа (себя и последнего админа удалить нельзя)
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const user = await getUser(req, id)

  if (req.auth_context?.actor_id === id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Нельзя удалить самого себя"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: all } = await query.graph({
    entity: "user",
    fields: ["id"],
  })
  if (all.length <= 1) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Нельзя удалить последнего админа"
    )
  }

  const authService = req.scope.resolve(Modules.AUTH)
  const identities = await authService.listAuthIdentities({
    provider_identities: { entity_id: user.email, provider: PROVIDER },
  })

  await deleteUsersWorkflow(req.scope).run({ input: { ids: [id] } })

  if (identities.length) {
    await authService.deleteAuthIdentities(identities.map((i) => i.id))
  }

  res.json({ id, object: "user", deleted: true })
}
