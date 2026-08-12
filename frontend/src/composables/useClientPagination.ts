import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { PaginationMeta } from '@/types/api'

/**
 * Paginación en memoria para listados que el backend devuelve completos.
 *
 * Los módulos CRUD paginan en el servidor y reciben su `meta`; los reportes no,
 * así que aquí se calcula el mismo `meta` para poder reusar `PaginationControls`.
 */
export function useClientPagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  pageSize = 10,
): {
  meta: ComputedRef<PaginationMeta>
  pageItems: ComputedRef<T[]>
  goToPage: (page: number) => void
} {
  const page = ref(1)

  // Al cambiar el listado (otro periodo, otro filtro) la página actual puede ya
  // no existir: se vuelve a la primera en lugar de mostrar una tabla vacía.
  watch(items, () => {
    page.value = 1
  })

  const meta = computed<PaginationMeta>(() => ({
    page: page.value,
    limit: pageSize,
    total: items.value.length,
    totalPages: Math.ceil(items.value.length / pageSize),
  }))

  const pageItems = computed(() =>
    items.value.slice((page.value - 1) * pageSize, page.value * pageSize),
  )

  function goToPage(next: number): void {
    page.value = next
  }

  return { meta, pageItems, goToPage }
}
