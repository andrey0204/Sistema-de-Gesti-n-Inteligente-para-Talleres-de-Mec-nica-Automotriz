/** Exportación de listados a CSV, para abrir los reportes en una hoja de cálculo. */

export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

// Excel en configuración regional es-CO espera punto y coma: la coma es el
// separador decimal, así que con «,» los importes partirían las columnas.
const SEPARATOR = ';'

/** Todo campo va entrecomillado; las comillas internas se duplican. */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [
    columns.map((column) => escapeCell(column.header)).join(SEPARATOR),
    ...rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(SEPARATOR)),
  ]
  return lines.join('\r\n')
}

/**
 * Descarga las filas como CSV. Se antepone el BOM UTF-8 porque, sin él, Excel
 * interpreta el archivo como ANSI y rompe las tildes y la «ñ».
 */
export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const blob = new Blob(['\uFEFF', toCsv(columns, rows)], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()

  URL.revokeObjectURL(url)
}
