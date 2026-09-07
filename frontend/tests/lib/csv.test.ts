import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCsv, type CsvColumn } from '@/lib/csv'

/**
 * `downloadCsv` es la única función exportada del módulo, y descarga un
 * archivo. Se sustituyen las dos piezas del navegador que usa —el enlace que
 * dispara la descarga y URL.createObjectURL— para poder leer el contenido del
 * Blob y comprobar el CSV que se habría descargado.
 */

let blobDescargado: Blob | null = null
let enlace: { href: string; download: string; click: ReturnType<typeof vi.fn> }
const revokeObjectURL = vi.fn()

beforeEach(() => {
  blobDescargado = null
  enlace = { href: '', download: '', click: vi.fn() }

  vi.stubGlobal('document', {
    createElement: vi.fn(() => enlace),
  })
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      blobDescargado = blob
      return 'blob:falso'
    }),
    revokeObjectURL,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function csvGenerado<T>(columns: CsvColumn<T>[], rows: T[], filename = 'reporte'): Promise<string> {
  downloadCsv(filename, columns, rows)
  return (await blobDescargado!.text())
}

interface Orden {
  numero: string
  cliente: string
  total: number | null
}

const columnas: CsvColumn<Orden>[] = [
  { header: 'Número', value: (o) => o.numero },
  { header: 'Cliente', value: (o) => o.cliente },
  { header: 'Total', value: (o) => o.total },
]

describe('downloadCsv — contenido', () => {
  it('escribe la cabecera y una fila por registro', async () => {
    const csv = await csvGenerado(columnas, [
      { numero: 'OT-001', cliente: 'Juan Perez', total: 150000 },
    ])

    expect(csv).toContain('"Número";"Cliente";"Total"')
    expect(csv).toContain('"OT-001";"Juan Perez";"150000"')
  })

  it('separa las columnas con punto y coma, no con coma', async () => {
    // En es-CO la coma es el separador decimal: con «,» los importes
    // partirían las columnas al abrir el archivo en Excel.
    const csv = await csvGenerado(columnas, [])
    expect(csv.split('\r\n')[0]).toBe('"Número";"Cliente";"Total"')
  })

  it('separa las filas con CRLF', async () => {
    const csv = await csvGenerado(columnas, [
      { numero: 'OT-001', cliente: 'A', total: 1 },
      { numero: 'OT-002', cliente: 'B', total: 2 },
    ])
    expect(csv.split('\r\n')).toHaveLength(3) // cabecera + 2 filas
  })

  it('entrecomilla todos los campos', async () => {
    const csv = await csvGenerado(columnas, [{ numero: 'OT-001', cliente: 'A', total: 1 }])
    expect(csv).not.toMatch(/;[^"]/)
  })

  it('duplica las comillas internas para no romper el campo', async () => {
    const csv = await csvGenerado(columnas, [
      { numero: 'OT-001', cliente: 'Taller "El Rápido"', total: 1 },
    ])
    expect(csv).toContain('"Taller ""El Rápido"""')
  })

  it('no deja que un punto y coma dentro de un dato parta la columna', async () => {
    const csv = await csvGenerado(columnas, [
      { numero: 'OT-001', cliente: 'Perez; Juan', total: 1 },
    ])
    expect(csv).toContain('"Perez; Juan"')
    expect(csv.split('\r\n')[1].split('";"')).toHaveLength(3)
  })

  it('escribe los nulos como campo vacío, no como "null"', async () => {
    const csv = await csvGenerado(columnas, [{ numero: 'OT-001', cliente: 'A', total: null }])
    expect(csv).toContain('"OT-001";"A";""')
    expect(csv).not.toContain('null')
  })

  it('genera solo la cabecera cuando no hay filas', async () => {
    const csv = await csvGenerado(columnas, [])
    expect(csv).toBe('"Número";"Cliente";"Total"')
  })
})

describe('downloadCsv — codificación', () => {
  it('antepone el BOM UTF-8 para que Excel no rompa las tildes', async () => {
    // Hay que mirar los bytes: Blob.text() decodifica como UTF-8 y esa
    // decodificación se come el BOM, así que sobre el texto no se ve.
    downloadCsv('reporte', columnas, [])
    const bytes = new Uint8Array(await blobDescargado!.arrayBuffer())

    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf])
  })

  it('escribe las tildes y la ñ en UTF-8', async () => {
    const csv = await csvGenerado(
      [{ header: 'Descripción', value: (o: { texto: string }) => o.texto }],
      [{ texto: 'Cambio de aceite y añadido de líquido' }],
    )
    expect(csv).toContain('Cambio de aceite y añadido de líquido')
    expect(csv).toContain('"Descripción"')
  })

  it('declara el tipo MIME con charset utf-8', () => {
    downloadCsv('reporte', columnas, [])
    expect(blobDescargado!.type).toBe('text/csv;charset=utf-8;')
  })
})

describe('downloadCsv — descarga', () => {
  it('añade la extensión .csv si el nombre no la trae', () => {
    downloadCsv('ordenes-agosto', columnas, [])
    expect(enlace.download).toBe('ordenes-agosto.csv')
  })

  it('no duplica la extensión si el nombre ya la trae', () => {
    downloadCsv('ordenes-agosto.csv', columnas, [])
    expect(enlace.download).toBe('ordenes-agosto.csv')
  })

  it('dispara la descarga y libera la URL temporal', () => {
    downloadCsv('reporte', columnas, [])
    expect(enlace.click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:falso')
  })
})
