<script setup lang="ts">
/**
 * Buscador de clientes para formularios: se escribe parte del nombre, teléfono
 * o documento y se elige uno de los resultados. Emite el `id` del cliente.
 *
 * Un `<select>` normal no sirve aquí porque el taller puede tener cientos de
 * clientes; se consulta la API con la misma búsqueda *debounced* del listado.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { listClients } from '@/api/clients'
import { getErrorMessage } from '@/lib/http'
import type { Client } from '@/types/models'

/** Datos mínimos que devuelve el backend al incluir el cliente en otra entidad. */
export type ClientOption = Pick<Client, 'id' | 'fullName' | 'phone'>

const RESULTS_LIMIT = 6
const SEARCH_DEBOUNCE_MS = 350

const props = defineProps<{
  /** Id del cliente elegido, o `null` si aún no hay ninguno. */
  modelValue: number | null
  /** Cliente ya asociado (al editar): evita una petición solo para su nombre. */
  selected?: ClientOption | null
  /** Marca el control en rojo cuando el formulario reporta un error. */
  invalid?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

// Los atributos sueltos (`id`) van al input de búsqueda, no al contenedor,
// para que la etiqueta `<label for>` del formulario apunte a un control real.
defineOptions({ inheritAttrs: false })

const chosen = ref<ClientOption | null>(null)
const query = ref('')
const results = ref<Client[]>([])
const searching = ref(false)
const searchError = ref('')
/** Último término consultado: evita el mensaje de «sin resultados» mientras se teclea. */
const searchedTerm = ref('')

let searchTimer: number | undefined

// El elegido se deriva del `modelValue`: así, al reiniciar el formulario (que
// deja el id en `null`), el buscador vuelve a quedar vacío.
watch(
  () => [props.modelValue, props.selected] as const,
  ([id, selected]) => {
    if (id === null) {
      chosen.value = null
      return
    }
    if (chosen.value?.id === id) return
    chosen.value = selected && selected.id === id ? selected : null
  },
  { immediate: true },
)

async function search(): Promise<void> {
  const term = query.value.trim()
  if (!term) {
    results.value = []
    searchedTerm.value = ''
    return
  }

  searching.value = true
  searchError.value = ''
  try {
    const result = await listClients({ search: term, limit: RESULTS_LIMIT })
    results.value = result.clients
    searchedTerm.value = term
  } catch (error) {
    searchError.value = getErrorMessage(error, 'No se pudieron buscar los clientes')
  } finally {
    searching.value = false
  }
}

function onQueryInput(): void {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(search, SEARCH_DEBOUNCE_MS)
}

function choose(client: Client): void {
  chosen.value = client
  query.value = ''
  results.value = []
  searchedTerm.value = ''
  emit('update:modelValue', client.id)
}

function clear(): void {
  emit('update:modelValue', null)
}

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div>
    <div
      v-if="chosen"
      class="flex items-center justify-between gap-3 rounded-lg border border-base-300 px-3 py-2"
    >
      <div class="min-w-0">
        <p class="truncate font-medium">{{ chosen.fullName }}</p>
        <p class="text-sm opacity-70">{{ chosen.phone }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-xs" @click="clear">Cambiar</button>
    </div>

    <template v-else>
      <input
        v-model="query"
        v-bind="$attrs"
        type="search"
        class="input input-bordered w-full"
        :class="{ 'input-error': invalid }"
        placeholder="Buscar cliente por nombre, teléfono o documento"
        @input="onQueryInput"
      />

      <div v-if="searching" class="mt-2 flex items-center gap-2 text-sm opacity-70">
        <span class="loading loading-spinner loading-xs"></span>
        Buscando…
      </div>

      <p v-else-if="searchError" class="mt-2 text-sm text-error">{{ searchError }}</p>

      <ul
        v-else-if="results.length > 0"
        class="menu menu-sm mt-2 rounded-lg border border-base-300 p-1"
      >
        <li v-for="client in results" :key="client.id">
          <button type="button" class="flex-col items-start gap-0" @click="choose(client)">
            <span class="font-medium">{{ client.fullName }}</span>
            <span class="text-xs opacity-70">
              {{ client.documentType }} {{ client.documentNumber }} · {{ client.phone }}
            </span>
          </button>
        </li>
      </ul>

      <p v-else-if="searchedTerm && searchedTerm === query.trim()" class="mt-2 text-sm opacity-70">
        Ningún cliente coincide con «{{ searchedTerm }}».
      </p>
    </template>
  </div>
</template>
