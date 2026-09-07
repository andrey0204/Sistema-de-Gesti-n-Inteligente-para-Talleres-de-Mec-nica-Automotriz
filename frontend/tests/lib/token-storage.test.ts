import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tokenStorage } from '@/lib/token-storage'
import type { AuthUser } from '@/types/models'

// localStorage no existe en Node: se sustituye por un Map con la misma API.
function fakeLocalStorage() {
  const datos = new Map<string, string>()
  return {
    getItem: vi.fn((clave: string) => datos.get(clave) ?? null),
    setItem: vi.fn((clave: string, valor: string) => void datos.set(clave, valor)),
    removeItem: vi.fn((clave: string) => void datos.delete(clave)),
    clear: () => datos.clear(),
    get size() {
      return datos.size
    },
  }
}

let storage: ReturnType<typeof fakeLocalStorage>

const usuario: AuthUser = {
  id: 1,
  email: 'admin@workshop.com',
  fullName: 'Admin',
  role: 'ADMIN',
}

beforeEach(() => {
  storage = fakeLocalStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tokens', () => {
  it('guarda y recupera los dos tokens', () => {
    tokenStorage.setTokens('access-abc', 'refresh-xyz')

    expect(tokenStorage.getAccessToken()).toBe('access-abc')
    expect(tokenStorage.getRefreshToken()).toBe('refresh-xyz')
  })

  it('devuelve null cuando no hay sesión guardada', () => {
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('usa claves con prefijo para no chocar con otras apps del mismo origen', () => {
    tokenStorage.setTokens('a', 'b')

    expect(storage.setItem).toHaveBeenCalledWith('workshop.accessToken', 'a')
    expect(storage.setItem).toHaveBeenCalledWith('workshop.refreshToken', 'b')
  })

  it('sobrescribe los tokens al renovarlos', () => {
    tokenStorage.setTokens('viejo-access', 'viejo-refresh')
    tokenStorage.setTokens('nuevo-access', 'nuevo-refresh')

    expect(tokenStorage.getAccessToken()).toBe('nuevo-access')
    expect(tokenStorage.getRefreshToken()).toBe('nuevo-refresh')
  })
})

describe('usuario', () => {
  it('guarda el usuario serializado y lo devuelve como objeto', () => {
    tokenStorage.setUser(usuario)

    expect(tokenStorage.getUser()).toEqual(usuario)
  })

  it('devuelve null si no hay usuario guardado', () => {
    expect(tokenStorage.getUser()).toBeNull()
  })

  it('no revienta si el JSON guardado está corrupto', () => {
    // Puede pasar si alguien edita localStorage a mano o queda un valor de
    // una versión anterior: la app debe arrancar como si no hubiera sesión.
    storage.setItem('workshop.user', '{esto no es json')

    expect(tokenStorage.getUser()).toBeNull()
  })

  it('limpia el valor corrupto para no reintentar leerlo en cada arranque', () => {
    storage.setItem('workshop.user', '{esto no es json')
    tokenStorage.getUser()

    expect(storage.removeItem).toHaveBeenCalledWith('workshop.user')
    expect(tokenStorage.getUser()).toBeNull()
  })
})

describe('clear', () => {
  it('borra la sesión entera al cerrar sesión', () => {
    tokenStorage.setTokens('access-abc', 'refresh-xyz')
    tokenStorage.setUser(usuario)

    tokenStorage.clear()

    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(tokenStorage.getUser()).toBeNull()
    expect(storage.size).toBe(0)
  })

  it('no falla si no había nada que borrar', () => {
    expect(() => tokenStorage.clear()).not.toThrow()
  })
})
