import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { toTypedSchema } from '@/lib/zod-form'

/**
 * Este adaptador sustituye a `@vee-validate/zod`, que sigue atado a Zod v3.
 * Lo que se comprueba aquí es el contrato que VeeValidate espera: un objeto
 * con `__type: 'VVTypedSchema'` y un `parse` que devuelve o el valor validado
 * o una lista de `{ path, errors }`.
 */

describe('forma del esquema', () => {
  it('se identifica como TypedSchema de VeeValidate', () => {
    expect(toTypedSchema(z.object({}))).toMatchObject({ __type: 'VVTypedSchema' })
  })
})

describe('parse — datos válidos', () => {
  it('devuelve el valor parseado y ningún error', async () => {
    const schema = toTypedSchema(z.object({ email: z.email(), edad: z.coerce.number() }))

    const resultado = await schema.parse({ email: 'admin@workshop.com', edad: '30' })

    expect(resultado.errors).toEqual([])
    expect(resultado.value).toEqual({ email: 'admin@workshop.com', edad: 30 })
  })

  it('aplica las transformaciones de Zod, no solo valida', () => {
    // Es lo que permite que un input de tipo number llegue al payload como
    // número aunque el DOM lo entregue como string.
    const schema = toTypedSchema(z.object({ costo: z.coerce.number() }))

    return expect(schema.parse({ costo: '150000' })).resolves.toMatchObject({
      value: { costo: 150000 },
    })
  })
})

describe('parse — datos inválidos', () => {
  it('devuelve un error por campo con la ruta y los mensajes', async () => {
    const schema = toTypedSchema(
      z.object({
        email: z.email('Correo inválido'),
        password: z.string().min(8, 'Mínimo 8 caracteres'),
      }),
    )

    const resultado = await schema.parse({ email: 'malo', password: '123' })

    expect(resultado.errors).toEqual([
      { path: 'email', errors: ['Correo inválido'] },
      { path: 'password', errors: ['Mínimo 8 caracteres'] },
    ])
  })

  it('no devuelve value cuando la validación falla', async () => {
    const schema = toTypedSchema(z.object({ email: z.email() }))

    expect((await schema.parse({ email: 'malo' })).value).toBeUndefined()
  })

  it('agrupa varios mensajes del mismo campo en una sola entrada', async () => {
    const schema = toTypedSchema(
      z.object({
        clave: z
          .string()
          .min(8, 'Mínimo 8 caracteres')
          .regex(/[0-9]/, 'Debe tener un número'),
      }),
    )

    const resultado = await schema.parse({ clave: 'abc' })

    expect(resultado.errors).toHaveLength(1)
    expect(resultado.errors[0]).toEqual({
      path: 'clave',
      errors: ['Mínimo 8 caracteres', 'Debe tener un número'],
    })
  })

  it('reporta un campo obligatorio que falta', async () => {
    const schema = toTypedSchema(z.object({ fullName: z.string() }))

    // El cast es necesario: el tipo de `parse` exige el objeto completo, y lo
    // que se prueba aquí es justo qué pasa cuando falta un campo.
    expect((await schema.parse({} as never)).errors[0].path).toBe('fullName')
  })
})

describe('parse — rutas anidadas', () => {
  it('traduce un objeto anidado a la notación con punto', async () => {
    const schema = toTypedSchema(z.object({ cliente: z.object({ email: z.email('Inválido') }) }))

    const resultado = await schema.parse({ cliente: { email: 'malo' } })

    expect(resultado.errors[0].path).toBe('cliente.email')
  })

  it('traduce un índice de array a la notación con corchetes', async () => {
    // Es la forma que VeeValidate necesita para marcar la fila correcta en
    // una lista de items de la orden.
    const schema = toTypedSchema(
      z.object({ items: z.array(z.object({ nombre: z.string().min(1, 'Requerido') })) }),
    )

    const resultado = await schema.parse({ items: [{ nombre: 'ok' }, { nombre: '' }] })

    expect(resultado.errors[0].path).toBe('items[1].nombre')
  })

  it('coloca el corchete al inicio si el array es la raíz', async () => {
    const schema = toTypedSchema(z.array(z.string().min(1, 'Requerido')))

    const resultado = await schema.parse(['ok', ''])

    expect(resultado.errors[0].path).toBe('[1]')
  })

  it('un error del objeto entero se reporta con ruta vacía', async () => {
    const schema = toTypedSchema(
      z.object({ desde: z.string(), hasta: z.string() }).refine((v) => v.desde <= v.hasta, {
        message: 'El rango está invertido',
      }),
    )

    const resultado = await schema.parse({ desde: '2026-09-10', hasta: '2026-09-01' })

    expect(resultado.errors).toEqual([{ path: '', errors: ['El rango está invertido'] }])
  })
})
