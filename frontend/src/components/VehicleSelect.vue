<script setup lang="ts">
/**
 * Buscador de vehículos para formularios y filtros: se escribe parte de la
 * placa, la marca o el modelo y se elige uno de los resultados. Emite el `id`.
 *
 * Mismo motivo que en `ClientSelect`: un `<select>` con todos los vehículos del
 * taller no es manejable, así que se consulta la API con búsqueda *debounced*.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { listVehicles } from '@/api/vehicles'
import { getErrorMessage } from '@/lib/http'
import type { Vehicle } from '@/types/models'

/** Datos mínimos que devuelve el backend al incluir el vehículo en otra entidad. */
export type VehicleOption = Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>

const RESULTS_LIMIT = 6
const SEARCH_DEBOUNCE_MS = 350

const props = defineProps<{
  /** Id del vehículo elegido, o `null` si aún no hay ninguno. */
  modelValue: number | null
  /** Vehículo ya asociado (al editar o filtrar): evita pedir solo su placa. */
  selected?: VehicleOption | null
  /** Marca el control en rojo cuando el formulario reporta un error. */
  invalid?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

// Los atributos sueltos (`id`) van al input de búsqueda, no al contenedor,
// para que la etiqueta `<label for>` apunte a un control real.
defineOptions({ inheritAttrs: false })

const chosen = ref<VehicleOption | null>(null)
const query = ref('')
const results = ref<Vehicle[]>([])
const searching = ref(false)
const searchError = ref('')
/** Último término consultado: evita el mensaje de «sin resultados» al teclear. */
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
    const result = await listVehicles({ search: term, limit: RESULTS_LIMIT })
    results.value = result.vehicles
    searchedTerm.value = term
  } catch (error) {
    searchError.value = getErrorMessage(error, 'No se pudieron buscar los vehículos')
  } finally {
    searching.value = false
  }
}

function onQueryInput(): void {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(search, SEARCH_DEBOUNCE_MS)
}

function choose(vehicle: Vehicle): void {
  chosen.value = vehicle
  query.value = ''
  results.value = []
  searchedTerm.value = ''
  emit('update:modelValue', vehicle.id)
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
        <p class="truncate font-mono font-medium">{{ chosen.plate }}</p>
        <p class="truncate text-sm opacity-70">{{ chosen.brand }} {{ chosen.model }}</p>
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
        placeholder="Buscar por placa, marca o modelo"
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
        <li v-for="vehicle in results" :key="vehicle.id">
          <button type="button" class="flex-col items-start gap-0" @click="choose(vehicle)">
            <span class="font-mono font-medium">{{ vehicle.plate }}</span>
            <span class="text-xs opacity-70">
              {{ vehicle.brand }} {{ vehicle.model }}
              <template v-if="vehicle.year">({{ vehicle.year }})</template>
              <template v-if="vehicle.client"> · {{ vehicle.client.fullName }}</template>
            </span>
          </button>
        </li>
      </ul>

      <p v-else-if="searchedTerm && searchedTerm === query.trim()" class="mt-2 text-sm opacity-70">
        Ningún vehículo coincide con «{{ searchedTerm }}».
      </p>
    </template>
  </div>
</template>
