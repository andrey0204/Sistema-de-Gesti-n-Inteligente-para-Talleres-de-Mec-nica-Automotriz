import type { TypedSchema } from 'vee-validate'
import type { ZodType, input as ZodInput, output as ZodOutput } from 'zod'

/**
 * Adaptador de Zod v4 para VeeValidate.
 *
 * El paquete oficial `@vee-validate/zod` todavía depende de la API de Zod v3
 * (importa `ZodFirstPartyTypeKind`, eliminado en v4), así que se implementa
 * aquí el contrato `TypedSchema` que espera VeeValidate. Son ~30 líneas y nos
 * permite usar la misma versión de Zod que el backend.
 *
 * Uso:
 *   const schema = toTypedSchema(z.object({ email: z.email() }))
 *   const { handleSubmit } = useForm({ validationSchema: schema })
 */
export function toTypedSchema<TSchema extends ZodType>(
  schema: TSchema,
): TypedSchema<ZodInput<TSchema>, ZodOutput<TSchema>> {
  return {
    __type: 'VVTypedSchema',

    async parse(values) {
      const result = await schema.safeParseAsync(values)

      if (result.success) {
        return { value: result.data, errors: [] }
      }

      // Se agrupan los mensajes por campo: VeeValidate espera un error por path.
      const byPath = new Map<string, string[]>()
      for (const issue of result.error.issues) {
        const path = joinPath(issue.path)
        const messages = byPath.get(path)
        if (messages) messages.push(issue.message)
        else byPath.set(path, [issue.message])
      }

      return {
        errors: [...byPath].map(([path, errors]) => ({ path, errors })),
      }
    },
  }
}

/**
 * Convierte el `path` de un issue de Zod (`['items', 0, 'name']`) a la
 * notación que usa VeeValidate para campos anidados (`items[0].name`).
 */
function joinPath(path: readonly PropertyKey[]): string {
  let result = ''
  for (const segment of path) {
    if (typeof segment === 'number') {
      result += `[${segment}]`
    } else if (typeof segment === 'string') {
      result += result ? `.${segment}` : segment
    }
  }
  return result
}
