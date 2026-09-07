import { describe, it, expect } from 'vitest'
import { ref, nextTick, computed } from 'vue'
import { useClientPagination } from '@/composables/useClientPagination'

const filas = (cantidad: number) => Array.from({ length: cantidad }, (_, i) => ({ id: i + 1 }))

describe('meta', () => {
  it('fabrica el mismo meta que devuelve el backend, para reusar PaginationControls', () => {
    const { meta } = useClientPagination(ref(filas(25)), 10)

    expect(meta.value).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 })
  })

  it('redondea totalPages hacia arriba', () => {
    expect(useClientPagination(ref(filas(21)), 10).meta.value.totalPages).toBe(3)
    expect(useClientPagination(ref(filas(20)), 10).meta.value.totalPages).toBe(2)
  })

  it('con la lista vacía informa 0 registros y 0 páginas', () => {
    const { meta, pageItems } = useClientPagination(ref([]), 10)

    expect(meta.value).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 })
    expect(pageItems.value).toEqual([])
  })

  it('usa 10 por página si no se indica otro tamaño', () => {
    expect(useClientPagination(ref(filas(5))).meta.value.limit).toBe(10)
  })
})

describe('pageItems', () => {
  it('devuelve el primer tramo al empezar', () => {
    const { pageItems } = useClientPagination(ref(filas(25)), 10)

    expect(pageItems.value).toHaveLength(10)
    expect(pageItems.value[0]).toEqual({ id: 1 })
    expect(pageItems.value[9]).toEqual({ id: 10 })
  })

  it('devuelve el tramo correcto tras cambiar de página', () => {
    const { pageItems, goToPage } = useClientPagination(ref(filas(25)), 10)

    goToPage(2)
    expect(pageItems.value[0]).toEqual({ id: 11 })

    goToPage(3)
    expect(pageItems.value).toEqual([{ id: 21 }, { id: 22 }, { id: 23 }, { id: 24 }, { id: 25 }])
  })

  it('la última página puede venir incompleta', () => {
    const { pageItems, goToPage } = useClientPagination(ref(filas(25)), 10)

    goToPage(3)
    expect(pageItems.value).toHaveLength(5)
  })

  it('no falla si se pide una página que no existe: devuelve vacío', () => {
    const { pageItems, goToPage } = useClientPagination(ref(filas(25)), 10)

    goToPage(99)
    expect(pageItems.value).toEqual([])
  })
})

describe('reacción a cambios en la lista', () => {
  it('vuelve a la primera página al cambiar el listado', async () => {
    // Ocurre al cambiar el periodo o un filtro del reporte: si se quedara en
    // la página 3 de un listado nuevo más corto, se vería una tabla vacía.
    const items = ref(filas(25))
    const { meta, pageItems, goToPage } = useClientPagination(items, 10)

    goToPage(3)
    expect(meta.value.page).toBe(3)

    items.value = filas(12)
    await nextTick()

    expect(meta.value.page).toBe(1)
    expect(pageItems.value[0]).toEqual({ id: 1 })
  })

  it('recalcula el total al cambiar el listado', async () => {
    const items = ref(filas(25))
    const { meta } = useClientPagination(items, 10)

    items.value = filas(3)
    await nextTick()

    expect(meta.value).toMatchObject({ total: 3, totalPages: 1 })
  })

  it('funciona igual con un computed que con un ref', async () => {
    // Los reportes le pasan un computed con la lista ya filtrada.
    const origen = ref(filas(25))
    const pares = computed(() => origen.value.filter((fila) => fila.id % 2 === 0))
    const { meta, pageItems } = useClientPagination(pares, 10)

    expect(meta.value.total).toBe(12)
    expect(pageItems.value[0]).toEqual({ id: 2 })

    origen.value = filas(4)
    await nextTick()

    expect(meta.value.total).toBe(2)
  })
})
