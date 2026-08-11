<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkOrderFormModal from './WorkOrderFormModal.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { listWorkOrders } from '@/api/work-orders'
import { listMechanics } from '@/api/users'
import { getErrorMessage } from '@/lib/http'
import { workOrderStatusBadges, workOrderStatusLabels } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { PaginationMeta } from '@/types/api'
import type { User, WorkOrder, WorkOrderStatus } from '@/types/models'

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/** Recepción y administración crean órdenes; el mecánico solo consulta las suyas. */
const canCreate = auth.hasRole('ADMIN', 'RECEPTIONIST')

const workOrders = ref<WorkOrder[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 })
const loading = ref(false)
const loadError = ref('')

/** Lee el estado de la URL descartando cualquier valor que no sea un estado válido. */
function readStatusFromQuery(): WorkOrderStatus | '' {
  const value = route.query.status
  if (typeof value !== 'string') return ''
  return value in workOrderStatusLabels ? (value as WorkOrderStatus) : ''
}

// Se inicializan desde la URL para que recargar la página mantenga los filtros.
const status = ref<WorkOrderStatus | ''>(readStatusFromQuery())
const mechanicId = ref(typeof route.query.mechanic === 'string' ? route.query.mechanic : '')
const page = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1)

// El mecánico no necesita el filtro: el backend ya le devuelve solo sus órdenes.
const mechanics = ref<User[]>([])

const formOpen = ref(false)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const result = await listWorkOrders({
      page: page.value,
      limit: PAGE_SIZE,
      status: status.value || undefined,
      assignedToUserId: mechanicId.value ? Number(mechanicId.value) : undefined,
    })
    workOrders.value = result.workOrders
    meta.value = result.meta
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar las órdenes')
  } finally {
    loading.value = false
  }
}

/** Guarda el estado del listado en la URL y recarga los datos. */
function reload(): void {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (status.value) query.status = status.value
  if (mechanicId.value) query.mechanic = mechanicId.value

  router.replace({ query })
  load()
}

function onFilterChange(): void {
  page.value = 1
  reload()
}

function goToPage(next: number): void {
  page.value = next
  reload()
}

/** Tras crear una orden se abre su detalle: es donde se cargan items e imágenes. */
function onCreated(workOrder: WorkOrder): void {
  formOpen.value = false
  router.push({ name: 'work-orders-detail', params: { id: workOrder.id } })
}

onMounted(async () => {
  load()

  if (canCreate) {
    try {
      mechanics.value = await listMechanics()
    } catch {
      // Sin la lista solo se pierde el filtro por mecánico; el listado sigue útil.
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-wrap gap-3">
        <div class="form-control">
          <label class="label" for="statusFilter">
            <span class="label-text">Estado</span>
          </label>
          <select
            id="statusFilter"
            v-model="status"
            class="select select-bordered"
            @change="onFilterChange"
          >
            <option value="">Todos</option>
            <option v-for="(label, value) in workOrderStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div v-if="canCreate && mechanics.length > 0" class="form-control">
          <label class="label" for="mechanicFilter">
            <span class="label-text">Mecánico</span>
          </label>
          <select
            id="mechanicFilter"
            v-model="mechanicId"
            class="select select-bordered"
            @change="onFilterChange"
          >
            <option value="">Todos</option>
            <option v-for="mechanic in mechanics" :key="mechanic.id" :value="String(mechanic.id)">
              {{ mechanic.fullName }}
            </option>
          </select>
        </div>
      </div>

      <button v-if="canCreate" type="button" class="btn btn-primary" @click="formOpen = true">
        Nueva orden
      </button>
    </div>

    <div v-if="loadError" role="alert" class="alert alert-error">
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm" @click="load">Reintentar</button>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-0 sm:p-4">
        <div v-if="loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="workOrders.length === 0" class="px-4 py-12 text-center">
          <div class="text-4xl">🔧</div>
          <p class="mt-3 font-medium">
            {{ status || mechanicId ? 'Sin órdenes con estos filtros' : 'Aún no hay órdenes de trabajo' }}
          </p>
          <p class="mt-1 text-sm opacity-70">
            {{
              status || mechanicId
                ? 'Prueba con otro estado o mecánico.'
                : canCreate
                  ? 'Crea la primera con el botón «Nueva orden».'
                  : 'Aquí aparecerán las órdenes que te asignen.'
            }}
          </p>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>N.º</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Mecánico</th>
                  <th>Creada</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in workOrders" :key="order.id" class="hover">
                  <td class="font-medium">#{{ order.id }}</td>
                  <td>{{ order.client?.fullName ?? '—' }}</td>
                  <td>
                    <span class="font-mono">{{ order.vehicle?.plate ?? '—' }}</span>
                    <span v-if="order.vehicle" class="ml-1 opacity-70">
                      {{ order.vehicle.brand }} {{ order.vehicle.model }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="workOrderStatusBadges[order.status]">
                      {{ workOrderStatusLabels[order.status] }}
                    </span>
                  </td>
                  <td>{{ order.assignedTo?.fullName ?? 'Sin asignar' }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <div class="flex justify-end">
                      <RouterLink
                        class="btn btn-ghost btn-xs"
                        :to="{ name: 'work-orders-detail', params: { id: order.id } }"
                      >
                        Ver detalle
                      </RouterLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-4 pb-4 sm:px-0 sm:pb-0">
            <PaginationControls :meta="meta" @change="goToPage" />
          </div>
        </template>
      </div>
    </div>

    <WorkOrderFormModal :open="formOpen" @close="formOpen = false" @created="onCreated" />
  </div>
</template>
