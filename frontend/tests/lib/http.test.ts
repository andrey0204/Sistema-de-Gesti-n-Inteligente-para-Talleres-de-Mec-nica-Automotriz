import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { getErrorMessage, getErrorCode, getFieldErrors } from '@/lib/http'

// ------------------------------------------------------------
// Utilidades de error (funciones puras)
// ------------------------------------------------------------

function axiosErrorConRespuesta(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as never
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  } as AxiosResponse)
}

describe('getErrorMessage', () => {
  it('prefiere el mensaje que manda el backend', () => {
    const error = axiosErrorConRespuesta(404, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Client not found' },
    })

    expect(getErrorMessage(error)).toBe('Client not found')
  })

  it('traduce el fallo de red a un mensaje entendible', () => {
    // Es lo que ve el usuario si el backend no está levantado.
    const error = new AxiosError('Network Error', 'ERR_NETWORK')

    expect(getErrorMessage(error)).toBe('No se pudo conectar con el servidor')
  })

  it('usa el mensaje de Axios cuando la respuesta no trae uno propio', () => {
    expect(getErrorMessage(axiosErrorConRespuesta(500, {}))).toBe('Request failed')
  })

  it('acepta un Error normal, no solo errores de Axios', () => {
    expect(getErrorMessage(new Error('algo falló'))).toBe('algo falló')
  })

  it('cae en el texto por defecto ante algo que no es un error', () => {
    expect(getErrorMessage('una cadena suelta')).toBe('Ocurrió un error inesperado')
    expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado')
  })

  it('permite cambiar el texto por defecto', () => {
    expect(getErrorMessage(null, 'No se pudo guardar')).toBe('No se pudo guardar')
  })
})

describe('getErrorCode', () => {
  it('devuelve el código del backend', () => {
    const error = axiosErrorConRespuesta(409, {
      success: false,
      error: { code: 'CONFLICT', message: 'Ya existe' },
    })

    expect(getErrorCode(error)).toBe('CONFLICT')
  })

  it('devuelve null si el error no viene de la API', () => {
    expect(getErrorCode(new Error('cualquier cosa'))).toBeNull()
    expect(getErrorCode(axiosErrorConRespuesta(500, {}))).toBeNull()
  })
})

describe('getFieldErrors', () => {
  it('convierte los details del 422 en un mapa campo → mensaje', () => {
    const error = axiosErrorConRespuesta(422, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [
          { field: 'body.email', message: 'Invalid email address' },
          { field: 'body.password', message: 'Password must be at least 8 characters' },
        ],
      },
    })

    expect(getFieldErrors(error)).toEqual({
      email: 'Invalid email address',
      password: 'Password must be at least 8 characters',
    })
  })

  it('recorta los prefijos body./params./query. para que casen con el formulario', () => {
    const error = axiosErrorConRespuesta(422, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '',
        details: [
          { field: 'params.id', message: 'Inválido' },
          { field: 'query.page', message: 'Inválido' },
        ],
      },
    })

    expect(Object.keys(getFieldErrors(error))).toEqual(['id', 'page'])
  })

  it('se queda con el primer mensaje cuando un campo tiene varios', () => {
    const error = axiosErrorConRespuesta(422, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '',
        details: [
          { field: 'body.email', message: 'Primero' },
          { field: 'body.email', message: 'Segundo' },
        ],
      },
    })

    expect(getFieldErrors(error)).toEqual({ email: 'Primero' })
  })

  it('ignora las entradas con forma inesperada en lugar de romperse', () => {
    const error = axiosErrorConRespuesta(422, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '',
        details: [null, 'texto suelto', { field: 42 }, { field: 'body.ok', message: 'Bien' }],
      },
    })

    expect(getFieldErrors(error)).toEqual({ ok: 'Bien' })
  })

  it('devuelve un mapa vacío si no hay details o el error no es de Axios', () => {
    expect(getFieldErrors(axiosErrorConRespuesta(500, {}))).toEqual({})
    expect(getFieldErrors(new Error('x'))).toEqual({})
  })
})

// ------------------------------------------------------------
// Interceptores: token y renovación automática
// ------------------------------------------------------------

/**
 * Para probar los interceptores se sustituye el adaptador de Axios, que es la
 * capa que hace la petición de verdad. Se asigna en `axios.defaults` antes de
 * importar el módulo, porque `axios.create()` copia los defaults al crear cada
 * instancia (y `http.ts` crea dos: la normal y la que renueva el token).
 */

interface PeticionRegistrada {
  url?: string
  authorization?: string
  body?: unknown
}

let peticiones: PeticionRegistrada[]
let responder: (config: AxiosRequestConfig) => Promise<AxiosResponse>
let storage: Map<string, string>

function respuesta(config: AxiosRequestConfig, data: unknown, status = 200): Promise<AxiosResponse> {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: config as never,
  })
}

function error401(config: AxiosRequestConfig): Promise<never> {
  return Promise.reject(
    new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config as never, {}, {
      status: 401,
      statusText: 'Unauthorized',
      data: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } },
      headers: {},
      config: config as never,
    } as AxiosResponse),
  )
}

async function cargarHttp() {
  vi.resetModules() // reinicia el refreshPromise compartido entre tests
  return import('@/lib/http')
}

beforeEach(() => {
  peticiones = []
  storage = new Map()
  responder = (config) => respuesta(config, { success: true, data: null })

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  })

  axios.defaults.adapter = (config) => {
    peticiones.push({
      url: config.url,
      authorization: config.headers?.Authorization as string | undefined,
      body: config.data,
    })
    return responder(config)
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  axios.defaults.adapter = undefined
})

describe('interceptor de petición', () => {
  it('adjunta el access token guardado', async () => {
    storage.set('workshop.accessToken', 'token-abc')
    const { http } = await cargarHttp()

    await http.get('/clients')

    expect(peticiones[0].authorization).toBe('Bearer token-abc')
  })

  it('no adjunta cabecera si no hay sesión', async () => {
    const { http } = await cargarHttp()

    await http.post('/auth/login', { email: 'a@b.c', password: 'x' })

    expect(peticiones[0].authorization).toBeUndefined()
  })
})

describe('renovación automática del token', () => {
  beforeEach(() => {
    storage.set('workshop.accessToken', 'viejo')
    storage.set('workshop.refreshToken', 'refresh-abc')
  })

  function respondeConRefresh(fallosIniciales = 1) {
    let fallos = 0
    responder = (config) => {
      if (config.url === '/auth/refresh') {
        return respuesta(config, {
          success: true,
          data: { accessToken: 'nuevo', refreshToken: 'refresh-nuevo' },
        })
      }
      if (fallos < fallosIniciales) {
        fallos += 1
        return error401(config)
      }
      return respuesta(config, { success: true, data: [] })
    }
  }

  it('ante un 401 renueva el token y reintenta la petición', async () => {
    respondeConRefresh()
    const { http } = await cargarHttp()

    const respuestaFinal = await http.get('/clients')

    expect(respuestaFinal.data).toEqual({ success: true, data: [] })
    expect(peticiones.map((p) => p.url)).toEqual(['/clients', '/auth/refresh', '/clients'])
  })

  it('el reintento va con el token nuevo', async () => {
    respondeConRefresh()
    const { http } = await cargarHttp()

    await http.get('/clients')

    expect(peticiones[0].authorization).toBe('Bearer viejo')
    expect(peticiones[2].authorization).toBe('Bearer nuevo')
  })

  it('guarda los dos tokens nuevos, porque el refresh rota', async () => {
    respondeConRefresh()
    const { http } = await cargarHttp()

    await http.get('/clients')

    expect(storage.get('workshop.accessToken')).toBe('nuevo')
    expect(storage.get('workshop.refreshToken')).toBe('refresh-nuevo')
  })

  it('varias peticiones que fallan a la vez comparten un solo refresh', async () => {
    // Sin el refreshPromise compartido, tres llamadas en paralelo lanzarían
    // tres refresh y, como el backend rota el token, dos fallarían.
    respondeConRefresh(3)
    const { http } = await cargarHttp()

    await Promise.all([http.get('/clients'), http.get('/vehicles'), http.get('/work-orders')])

    expect(peticiones.filter((p) => p.url === '/auth/refresh')).toHaveLength(1)
  })

  it('no reintenta más de una vez la misma petición', async () => {
    // El 401 persiste aunque el refresh funcione: debe rendirse, no ciclar.
    responder = (config) =>
      config.url === '/auth/refresh'
        ? respuesta(config, { success: true, data: { accessToken: 'nuevo', refreshToken: 'r' } })
        : error401(config)
    const { http } = await cargarHttp()

    await expect(http.get('/clients')).rejects.toThrowError()
    expect(peticiones.filter((p) => p.url === '/clients')).toHaveLength(2)
  })
})

describe('cuándo NO se renueva el token', () => {
  it('un 401 del login se devuelve tal cual', async () => {
    // Credenciales incorrectas no son una sesión caducada.
    storage.set('workshop.refreshToken', 'refresh-abc')
    responder = (config) => error401(config)
    const { http } = await cargarHttp()

    await expect(http.post('/auth/login', {})).rejects.toThrowError()
    expect(peticiones.map((p) => p.url)).toEqual(['/auth/login'])
  })

  it('sin refresh token guardado no se intenta renovar', async () => {
    responder = (config) => error401(config)
    const { http } = await cargarHttp()

    await expect(http.get('/clients')).rejects.toThrowError()
    expect(peticiones).toHaveLength(1)
  })

  it('un error que no es 401 no dispara renovación', async () => {
    storage.set('workshop.refreshToken', 'refresh-abc')
    responder = (config) =>
      Promise.reject(
        new AxiosError('Server error', 'ERR_BAD_RESPONSE', config as never, {}, {
          status: 500,
          statusText: '',
          data: {},
          headers: {},
          config: config as never,
        } as AxiosResponse),
      )
    const { http } = await cargarHttp()

    await expect(http.get('/clients')).rejects.toThrowError()
    expect(peticiones).toHaveLength(1)
  })
})

describe('sesión caducada', () => {
  it('si el refresh falla, limpia la sesión y avisa a la aplicación', async () => {
    storage.set('workshop.accessToken', 'viejo')
    storage.set('workshop.refreshToken', 'refresh-caducado')
    responder = (config) => error401(config) // también falla el refresh

    const { http, setSessionExpiredHandler } = await cargarHttp()
    const alCaducar = vi.fn()
    setSessionExpiredHandler(alCaducar)

    await expect(http.get('/clients')).rejects.toThrowError()

    expect(alCaducar).toHaveBeenCalledOnce()
    expect(storage.has('workshop.accessToken')).toBe(false)
    expect(storage.has('workshop.refreshToken')).toBe(false)
  })

  it('no falla si la aplicación no registró ningún manejador', async () => {
    storage.set('workshop.refreshToken', 'refresh-caducado')
    responder = (config) => error401(config)
    const { http } = await cargarHttp()

    await expect(http.get('/clients')).rejects.toThrowError()
    expect(storage.has('workshop.refreshToken')).toBe(false)
  })
})
