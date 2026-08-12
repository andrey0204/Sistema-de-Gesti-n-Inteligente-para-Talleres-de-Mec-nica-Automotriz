<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReportClientsTable from './ReportClientsTable.vue'
import ReportOrdersTable from './ReportOrdersTable.vue'
import ReportStatusBreakdown from './ReportStatusBreakdown.vue'
import ReportVehiclesTable from './ReportVehiclesTable.vue'
import {
  getClientsByPeriod,
  getOrdersByPeriod,
  getOrdersByStatus,
  getVehiclesByPeriod,
  type ClientsByPeriodReport,
  type OrdersByPeriodReport,
  type OrdersByStatusReport,
  type Period,
  type VehiclesByPeriodReport,
} from '@/api/reports'
import { getErrorMessage } from '@/lib/http'
import { formatDateOnly, formatNumber, toLocalDateInputValue, todayInputValue } from '@/lib/format'

const PRESETS = [
  { id: 'thisMonth', label: 'Este mes' },
  { id: 'last30', label: 'Últimos 30 días' },
  { id: 'lastMonth', label: 'Mes pasado' },
  { id: 'thisYear', label: 'Este año' },
] as const

type PresetId = (typeof PRESETS)[number]['id']

const TABS = [
  { id: 'ordenes', label: 'Órdenes' },
  { id: 'vehiculos', label: 'Vehículos atendidos' },
  { id: 'clientes', label: 'Clientes atendidos' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Rangos calculados sobre el calendario local; el día de hoy siempre entra. */
function presetPeriod(id: PresetId): Period {
  const now = new Date()

  switch (id) {
    case 'thisMonth':
      return {
        from: toLocalDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: todayInputValue(),
      }
    case 'last30': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29) // 29 + hoy = 30 días
      return { from: toLocalDateInputValue(start), to: todayInputValue() }
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      // El día 0 del mes actual es el último del anterior.
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toLocalDateInputValue(start), to: toLocalDateInputValue(end) }
    }
    case 'thisYear':
      return {
        from: toLocalDateInputValue(new Date(now.getFullYear(), 0, 1)),
        to: todayInputValue(),
      }
  }
}

const route = useRoute()
const router = useRouter()

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Solo se acepta de la URL una fecha con el formato que espera el input. */
function readDateFromQuery(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' && DATE_PATTERN.test(value) ? value : null
}

function readTabFromQuery(): TabId {
  const value = route.query.vista
  return TABS.some((tab) => tab.id === value) ? (value as TabId) : 'ordenes'
}

const initialPeriod = presetPeriod('thisMonth')

// El formulario y el periodo consultado van por separado: cambiar una fecha no
// dispara la consulta hasta pulsar «Aplicar», para no pedir un rango a medias.
const fromInput = ref(readDateFromQuery('desde') ?? initialPeriod.from)
const toInput = ref(readDateFromQuery('hasta') ?? initialPeriod.to)
const period = ref<Period>({ from: fromInput.value, to: toInput.value })

const tab = ref<TabId>(readTabFromQuery())

const ordersReport = ref<OrdersByPeriodReport | null>(null)
const vehiclesReport = ref<VehiclesByPeriodReport | null>(null)
const clientsReport = ref<ClientsByPeriodReport | null>(null)
const statusReport = ref<OrdersByStatusReport | null>(null)

const loading = ref(false)
const statusLoading = ref(false)
const loadError = ref('')
const rangeError = ref('')

const today = todayInputValue()

const orders = computed(() => ordersReport.value?.orders ?? [])
const vehicles = computed(() => vehiclesReport.value?.vehicles ?? [])
const clients = computed(() => clientsReport.value?.clients ?? [])

/** Sufijo de los archivos exportados: `2026-08-01_2026-08-12`. */
const periodLabel = computed(() => `${period.value.from}_${period.value.to}`)

const summary = computed(() => [
  { label: 'Órdenes creadas', value: ordersReport.value?.total ?? 0, icon: '🔧' },
  { label: 'Vehículos atendidos', value: vehiclesReport.value?.total ?? 0, icon: '🚗' },
  { label: 'Clientes atendidos', value: clientsReport.value?.total ?? 0, icon: '👥' },
])

async function loadPeriodReports(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    // Los tres reportes cubren el mismo rango: se piden juntos para que las
    // tarjetas de resumen nunca muestren cifras de periodos distintos.
    const [orders, vehicles, clients] = await Promise.all([
      getOrdersByPeriod(period.value),
      getVehiclesByPeriod(period.value),
      getClientsByPeriod(period.value),
    ])
    ordersReport.value = orders
    vehiclesReport.value = vehicles
    clientsReport.value = clients
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar los reportes')
  } finally {
    loading.value = false
  }
}

/** Se pide una sola vez: no depende del rango elegido. */
async function loadStatusReport(): Promise<void> {
  statusLoading.value = true
  try {
    statusReport.value = await getOrdersByStatus()
  } catch {
    // Es un panel secundario: si falla, el resto del reporte sigue siendo útil
    // y la tarjeta muestra su estado vacío.
    statusReport.value = null
  } finally {
    statusLoading.value = false
  }
}

/** Guarda el rango y la pestaña en la URL para poder recargar o compartirla. */
function syncQuery(): void {
  router.replace({
    query: {
      desde: period.value.from,
      hasta: period.value.to,
      ...(tab.value === 'ordenes' ? {} : { vista: tab.value }),
    },
  })
}

function applyPeriod(): void {
  if (fromInput.value > toInput.value) {
    rangeError.value = 'La fecha inicial no puede ser posterior a la final.'
    return
  }

  rangeError.value = ''
  period.value = { from: fromInput.value, to: toInput.value }
  syncQuery()
  loadPeriodReports()
}

function applyPreset(id: PresetId): void {
  const next = presetPeriod(id)
  fromInput.value = next.from
  toInput.value = next.to
  applyPeriod()
}

function selectTab(id: TabId): void {
  tab.value = id
  syncQuery()
}

onMounted(() => {
  syncQuery()
  loadPeriodReports()
  loadStatusReport()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in PRESETS"
            :key="preset.id"
            type="button"
            class="btn btn-sm"
            @click="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <div class="form-control">
            <label class="label" for="fromDate">
              <span class="label-text">Desde</span>
            </label>
            <input
              id="fromDate"
              v-model="fromInput"
              type="date"
              class="input input-bordered"
              :max="today"
            />
          </div>

          <div class="form-control">
            <label class="label" for="toDate">
              <span class="label-text">Hasta</span>
            </label>
            <input
              id="toDate"
              v-model="toInput"
              type="date"
              class="input input-bordered"
              :max="today"
            />
          </div>

          <button type="button" class="btn btn-primary" :disabled="loading" @click="applyPeriod">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            Aplicar
          </button>
        </div>

        <p v-if="rangeError" role="alert" class="text-sm text-error">{{ rangeError }}</p>

        <!-- `formatDateOnly` (no `formatDate`): un `YYYY-MM-DD` se parsea como
             medianoche UTC y en Colombia se vería un día antes. -->
        <p v-else class="text-sm opacity-70">
          Mostrando del <span class="font-medium">{{ formatDateOnly(period.from) }}</span> al
          <span class="font-medium">{{ formatDateOnly(period.to) }}</span>
        </p>
      </div>
    </div>

    <div v-if="loadError" role="alert" class="alert alert-error">
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm" @click="loadPeriodReports">Reintentar</button>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="card in summary" :key="card.label" class="card bg-base-100 shadow-sm">
            <div class="card-body gap-1">
              <span class="text-2xl">{{ card.icon }}</span>
              <span class="text-sm opacity-70">{{ card.label }}</span>
              <span v-if="loading" class="loading loading-sm"></span>
              <span v-else class="text-3xl font-semibold tabular-nums">
                {{ formatNumber(card.value) }}
              </span>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body gap-4">
            <div role="tablist" class="tabs tabs-box self-start">
              <button
                v-for="item in TABS"
                :key="item.id"
                type="button"
                role="tab"
                class="tab"
                :class="{ 'tab-active': tab === item.id }"
                @click="selectTab(item.id)"
              >
                {{ item.label }}
              </button>
            </div>

            <div v-if="loading" class="flex justify-center py-12">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <template v-else>
              <ReportOrdersTable
                v-if="tab === 'ordenes'"
                :orders="orders"
                :period-label="periodLabel"
              />
              <ReportVehiclesTable
                v-else-if="tab === 'vehiculos'"
                :vehicles="vehicles"
                :period-label="periodLabel"
              />
              <ReportClientsTable v-else :clients="clients" :period-label="periodLabel" />
            </template>
          </div>
        </div>
      </div>

      <ReportStatusBreakdown :report="statusReport" :loading="statusLoading" />
    </div>
  </div>
</template>
