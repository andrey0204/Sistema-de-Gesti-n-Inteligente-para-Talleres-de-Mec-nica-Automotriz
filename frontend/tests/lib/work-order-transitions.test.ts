import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import {
  getAllowedTransitions,
  isBackwardTransition,
  isFinalStatus,
} from '@/lib/work-order-transitions'
import type { WorkOrderStatus } from '@/types/models'

const ESTADOS: WorkOrderStatus[] = [
  'PENDING',
  'DIAGNOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELIVERED',
  'CANCELLED',
]

describe('getAllowedTransitions', () => {
  it('ofrece avanzar y cancelar desde un estado intermedio', () => {
    expect(getAllowedTransitions('PENDING', 'MECHANIC')).toEqual(['DIAGNOSED', 'CANCELLED'])
  })

  it('añade el retroceso solo para el administrador', () => {
    expect(getAllowedTransitions('IN_PROGRESS', 'ADMIN')).toEqual([
      'COMPLETED',
      'CANCELLED',
      'DIAGNOSED',
    ])
    expect(getAllowedTransitions('IN_PROGRESS', 'RECEPTIONIST')).toEqual(['COMPLETED', 'CANCELLED'])
  })

  it('trata un rol nulo como no-administrador', () => {
    // La vista puede pedirlo antes de que el store de auth esté cargado; no
    // debe ofrecer acciones de administrador por defecto.
    expect(getAllowedTransitions('IN_PROGRESS', null)).toEqual(['COMPLETED', 'CANCELLED'])
  })

  it.each(['DELIVERED', 'CANCELLED'] as const)('no ofrece ninguna acción desde %s', (estado) => {
    expect(getAllowedTransitions(estado, 'ADMIN')).toEqual([])
  })

  it('PENDING no ofrece retroceso ni al administrador', () => {
    expect(getAllowedTransitions('PENDING', 'ADMIN')).toEqual(['DIAGNOSED', 'CANCELLED'])
  })
})

describe('isBackwardTransition', () => {
  it('reconoce el retroceso, que la vista pinta distinto', () => {
    expect(isBackwardTransition('IN_PROGRESS', 'DIAGNOSED')).toBe(true)
  })

  it('no marca como retroceso el avance ni la cancelación', () => {
    expect(isBackwardTransition('IN_PROGRESS', 'COMPLETED')).toBe(false)
    expect(isBackwardTransition('IN_PROGRESS', 'CANCELLED')).toBe(false)
  })

  it('coincide con lo que ofrece getAllowedTransitions al administrador', () => {
    for (const estado of ESTADOS) {
      const soloAdmin = getAllowedTransitions(estado, 'ADMIN').filter(
        (destino) => !getAllowedTransitions(estado, 'MECHANIC').includes(destino),
      )
      for (const destino of soloAdmin) {
        expect(isBackwardTransition(estado, destino)).toBe(true)
      }
    }
  })
})

describe('isFinalStatus', () => {
  it.each(['DELIVERED', 'CANCELLED'] as const)('%s es final', (estado) => {
    expect(isFinalStatus(estado)).toBe(true)
  })

  it.each(['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED'] as const)(
    '%s no es final',
    (estado) => {
      expect(isFinalStatus(estado)).toBe(false)
    },
  )
})

/**
 * Esta tabla es una copia de la del backend, mantenida a mano para decidir qué
 * botones mostrar. El riesgo conocido es que alguien cambie las reglas allí y
 * la copia se quede vieja; estos tests leen los dos archivos y comparan las
 * tablas para que esa desincronización salte aquí y no en producción.
 */
describe('sincronía con la máquina de estados del backend', () => {
  function tabla(fuente: string, nombre: string): Record<string, string[]> {
    const bloque = new RegExp(`const ${nombre}[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(fuente)
    if (!bloque) throw new Error(`No se encontró la constante ${nombre}`)

    const resultado: Record<string, string[]> = {}
    for (const linea of bloque[1].split('\n')) {
      const entrada = /^\s*(\w+):\s*\[(.*)\],\s*$/.exec(linea)
      if (!entrada) continue
      resultado[entrada[1]] = entrada[2]
        .split(',')
        .map((valor) => valor.trim().replace(/^'|'$/g, ''))
        .filter(Boolean)
    }
    return resultado
  }

  const leer = (ruta: string) =>
    readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')

  const delFrontend = leer('../../src/lib/work-order-transitions.ts')
  const delBackend = leer('../../../backend/src/modules/work-orders/work-orders.state-machine.ts')

  it.each(['FORWARD_TRANSITIONS', 'ADMIN_BACKWARD_TRANSITIONS'])(
    '%s es idéntica en frontend y backend',
    (nombre) => {
      expect(tabla(delFrontend, nombre)).toEqual(tabla(delBackend, nombre))
    },
  )

  it('las tablas cubren los seis estados, sin sobrar ni faltar ninguno', () => {
    expect(Object.keys(tabla(delFrontend, 'FORWARD_TRANSITIONS')).sort()).toEqual([...ESTADOS].sort())
  })
})
