import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * La cola de avisos es estado a nivel de módulo, compartido por toda la app.
 * Cada test reimporta el módulo para partir de una cola vacía, y usa temporizadores
 * falsos para no esperar los 4 segundos reales del auto-cierre.
 */
async function cargarToast() {
  vi.resetModules()
  const { useToast } = await import('@/composables/useToast')
  return useToast()
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('publicar avisos', () => {
  it('empieza con la cola vacía', async () => {
    const { toasts } = await cargarToast()
    expect(toasts.value).toEqual([])
  })

  it.each(['success', 'error', 'info'] as const)('%s añade un aviso de ese tipo', async (tipo) => {
    const toast = await cargarToast()
    toast[tipo]('Mensaje de prueba')

    expect(toast.toasts.value).toEqual([{ id: 0, type: tipo, message: 'Mensaje de prueba' }])
  })

  it('apila varios avisos en orden', async () => {
    const toast = await cargarToast()
    toast.success('Cliente creado')
    toast.error('Falló el guardado')

    expect(toast.toasts.value.map((t) => t.message)).toEqual([
      'Cliente creado',
      'Falló el guardado',
    ])
  })

  it('da un id distinto a cada aviso, aunque el mensaje se repita', async () => {
    const toast = await cargarToast()
    toast.info('Igual')
    toast.info('Igual')

    const ids = toast.toasts.value.map((t) => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('cierre automático', () => {
  it('el aviso desaparece a los 4 segundos', async () => {
    const toast = await cargarToast()
    toast.success('Cliente creado')

    vi.advanceTimersByTime(3999)
    expect(toast.toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('cada aviso cuenta su propio tiempo', async () => {
    const toast = await cargarToast()
    toast.success('Primero')

    vi.advanceTimersByTime(2000)
    toast.success('Segundo')

    vi.advanceTimersByTime(2000) // se cumplen los 4s del primero
    expect(toast.toasts.value.map((t) => t.message)).toEqual(['Segundo'])

    vi.advanceTimersByTime(2000)
    expect(toast.toasts.value).toHaveLength(0)
  })
})

describe('cierre manual', () => {
  it('dismiss quita solo el aviso indicado', async () => {
    const toast = await cargarToast()
    toast.success('Primero')
    toast.error('Segundo')

    toast.dismiss(toast.toasts.value[0].id)

    expect(toast.toasts.value.map((t) => t.message)).toEqual(['Segundo'])
  })

  it('cerrar a mano y que luego venza el temporizador no rompe nada', async () => {
    const toast = await cargarToast()
    toast.success('Primero')
    toast.dismiss(toast.toasts.value[0].id)

    expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('dismiss con un id inexistente no altera la cola', async () => {
    const toast = await cargarToast()
    toast.success('Primero')

    toast.dismiss(999)

    expect(toast.toasts.value).toHaveLength(1)
  })
})

describe('estado compartido', () => {
  it('dos llamadas a useToast ven la misma cola', async () => {
    // Es lo que permite que cualquier vista publique un aviso y que el
    // ToastHost, montado una sola vez en el layout, lo muestre.
    vi.resetModules()
    const { useToast } = await import('@/composables/useToast')
    const desdeLaVista = useToast()
    const desdeElHost = useToast()

    desdeLaVista.success('Cliente creado')

    expect(desdeElHost.toasts.value).toHaveLength(1)
  })
})
