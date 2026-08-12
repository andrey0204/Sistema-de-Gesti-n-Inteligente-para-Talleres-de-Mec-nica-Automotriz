/** Formateadores para mostrar datos de la API en la interfaz. */

// En pesos los importes suelen ser enteros, pero el backend guarda Decimal(10,2):
// se muestran los centavos solo cuando el importe realmente los tiene, para no
// redondear un precio guardado (60000.50 no debe verse como $ 60.001).
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const currencyWithCentsFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('es-CO')

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// Los campos «solo fecha» (como `scheduledDate` de los recordatorios) se envían
// como `YYYY-MM-DD` y el backend los guarda a medianoche UTC. Formatearlos en la
// zona local los correría un día hacia atrás en Colombia (UTC-5), así que se
// formatean en UTC para recuperar el día del calendario tal cual se eligió.
const dateOnlyFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * Los campos `Decimal` de Prisma llegan como string (ej. `"150000.00"`),
 * por eso se convierten antes de formatear.
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const amount = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(amount)) return '—'
  return Number.isInteger(amount)
    ? currencyFormatter.format(amount)
    : currencyWithCentsFormatter.format(amount)
}

/** Separadores de miles para cantidades enteras (kilometraje, unidades…). */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

/**
 * Fecha de un campo «solo fecha» (guardado a medianoche UTC), sin hora.
 * Para marcas de tiempo reales —`createdAt`, `updatedAt`— usa `formatDate`.
 */
export function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateOnlyFormatter.format(date)
}

/**
 * Convierte una fecha ISO a `YYYY-MM-DD` para inputs de tipo `date`.
 * Usa la fecha UTC, la misma convención con la que se guardan los campos
 * «solo fecha», de modo que el valor del input coincide con lo mostrado.
 */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * `YYYY-MM-DD` del día que marca el reloj del usuario. No se usa
 * `toISOString()`: de noche en Colombia ya sería el día siguiente en UTC.
 *
 * Es la contraparte local de `toDateInputValue`, que trabaja en UTC porque los
 * campos «solo fecha» del backend se guardan a medianoche UTC. Este se usa para
 * fechas del calendario real del usuario (hoy, rangos de un reporte).
 */
export function toLocalDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Hoy en `YYYY-MM-DD`, para comparar fechas programadas o limitar un input `date`. */
export function todayInputValue(): string {
  return toLocalDateInputValue(new Date())
}
