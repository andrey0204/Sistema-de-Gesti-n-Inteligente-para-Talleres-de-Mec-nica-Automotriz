import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatDateOnly,
  toDateInputValue,
  toLocalDateInputValue,
  todayInputValue,
} from '@/lib/format'

// Intl usa espacios no separables (y estrechos) alrededor del símbolo de
// moneda; normalizarlos hace las aserciones legibles y estables entre
// versiones de Node.
const norm = (texto: string) => texto.replace(/ | /g, ' ')

describe('entorno de los tests', () => {
  it('corre en la zona horaria de Colombia (UTC-5)', () => {
    // Si esto falla, los tests de fechas de abajo no significan nada.
    expect(new Date('2026-05-15T00:00:00.000Z').getTimezoneOffset()).toBe(300)
  })
})

describe('formatCurrency', () => {
  it('formatea un importe entero sin centavos', () => {
    expect(norm(formatCurrency(150000))).toBe('$ 150.000')
  })

  it('acepta el string que devuelve un Decimal de Prisma', () => {
    // El backend manda "150000.00", no el número 150000.
    expect(norm(formatCurrency('150000.00'))).toBe('$ 150.000')
  })

  it('muestra los centavos solo cuando el importe los tiene', () => {
    // 60000.50 no debe redondearse a $ 60.001: es un precio guardado.
    expect(norm(formatCurrency('60000.50'))).toBe('$ 60.000,50')
  })

  it('usa el punto como separador de miles, según la convención es-CO', () => {
    expect(norm(formatCurrency(1234567))).toBe('$ 1.234.567')
  })

  it('formatea el cero como importe, no como vacío', () => {
    expect(norm(formatCurrency(0))).toBe('$ 0')
  })

  it.each([null, undefined, '', 'no-es-un-numero'])('muestra — para el valor %o', (valor) => {
    expect(formatCurrency(valor as never)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('separa los miles de un kilometraje', () => {
    expect(formatNumber(45000)).toBe('45.000')
  })

  it('formatea el cero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it.each([null, undefined, NaN])('muestra — para el valor %o', (valor) => {
    expect(formatNumber(valor as never)).toBe('—')
  })
})

describe('formatDate — marcas de tiempo reales', () => {
  it('muestra la fecha en formato día/mes/año', () => {
    expect(formatDate('2026-05-15T14:30:00.000Z')).toBe('15/05/2026')
  })

  it('convierte a hora local: una marca de la madrugada UTC es el día anterior en Colombia', () => {
    // 02:00 UTC del día 15 son las 21:00 del día 14 en Bogotá. Para createdAt
    // y updatedAt esto es lo correcto: son instantes, no días de calendario.
    expect(formatDate('2026-05-15T02:00:00.000Z')).toBe('14/05/2026')
  })

  it('acepta un objeto Date además del string de la API', () => {
    expect(formatDate(new Date('2026-05-15T14:30:00.000Z'))).toBe('15/05/2026')
  })

  it.each([null, undefined, '', 'fecha-invalida'])('muestra — para %o', (valor) => {
    expect(formatDate(valor as never)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('añade la hora local a la fecha', () => {
    expect(norm(formatDateTime('2026-05-15T14:30:00.000Z'))).toMatch(/^15\/05\/2026, 09:30\s?a/i)
  })

  it('muestra — para un valor vacío', () => {
    expect(formatDateTime(null)).toBe('—')
  })
})

describe('formatDateOnly — campos «solo fecha»', () => {
  it('conserva el día elegido pese al desfase de UTC-5', () => {
    // Este es el caso de scheduledDate: se eligió el 15/05 y se guardó como
    // medianoche UTC. Con formatDate se vería 14/05; con formatDateOnly, 15/05.
    expect(formatDateOnly('2026-05-15T00:00:00.000Z')).toBe('15/05/2026')
    expect(formatDate('2026-05-15T00:00:00.000Z')).toBe('14/05/2026')
  })

  it('funciona también en el cambio de año', () => {
    expect(formatDateOnly('2026-01-01T00:00:00.000Z')).toBe('01/01/2026')
  })

  it('muestra — para un valor vacío o inválido', () => {
    expect(formatDateOnly(null)).toBe('—')
    expect(formatDateOnly('cualquier-cosa')).toBe('—')
  })
})

describe('toDateInputValue — rellenar un input date al editar', () => {
  it('devuelve el día UTC, que es el que se guardó', () => {
    expect(toDateInputValue('2026-05-15T00:00:00.000Z')).toBe('2026-05-15')
  })

  it('es coherente con formatDateOnly: el input muestra lo mismo que la tabla', () => {
    const iso = '2026-05-15T00:00:00.000Z'
    expect(toDateInputValue(iso)).toBe('2026-05-15')
    expect(formatDateOnly(iso)).toBe('15/05/2026')
  })

  it('devuelve cadena vacía, no —, para que el input quede en blanco', () => {
    expect(toDateInputValue(null)).toBe('')
    expect(toDateInputValue('fecha-invalida')).toBe('')
  })
})

describe('toLocalDateInputValue — el día del reloj del usuario', () => {
  it('devuelve el día local, no el UTC', () => {
    // A las 20:00 en Bogotá ya es el día siguiente en UTC. toISOString daría
    // el 16; aquí debe salir el 15, que es el día que ve el usuario.
    const nocheEnBogota = new Date('2026-05-16T01:00:00.000Z')
    expect(nocheEnBogota.toISOString().slice(0, 10)).toBe('2026-05-16')
    expect(toLocalDateInputValue(nocheEnBogota)).toBe('2026-05-15')
  })

  it('rellena con cero los meses y días de un solo dígito', () => {
    expect(toLocalDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('todayInputValue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve el día local de hoy', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T01:00:00.000Z')) // 20:00 del 15 en Bogotá

    expect(todayInputValue()).toBe('2026-05-15')
  })
})
