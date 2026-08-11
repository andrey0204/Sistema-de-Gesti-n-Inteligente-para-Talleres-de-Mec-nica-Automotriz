<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReminderFormModal from './ReminderFormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import VehicleSelect, { type VehicleOption } from '@/components/VehicleSelect.vue'
import { completeReminder, deleteReminder, listReminders } from '@/api/maintenance-reminders'
import { getVehicle } from '@/api/vehicles'
import { getErrorMessage } from '@/lib/http'
import { reminderStatusBadges, reminderStatusLabels } from '@/lib/labels'
import { formatDateOnly, toDateInputValue, todayInputValue } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { PaginationMeta } from '@/types/api'
import type { MaintenanceReminder, ReminderStatus } from '@/types/models'

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

/** El borrado de recordatorios es físico, por eso el backend lo reserva a ADMIN. */
const canDelete = auth.hasRole('ADMIN')

const reminders = ref<MaintenanceReminder[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 })
const loading = ref(false)
const loadError = ref('')

/** Lee el estado de la URL descartando cualquier valor que no sea válido. */
function readStatusFromQuery(): ReminderStatus | '' {
  const value = route.query.status
  if (typeof value !== 'string') return ''
  return value in reminderStatusLabels ? (value as ReminderStatus) : ''
}

// Se inicializan desde la URL para que recargar la página mantenga los filtros.
const status = ref<ReminderStatus | ''>(readStatusFromQuery())
const vehicleId = ref<number | null>(Number(route.query.vehiculo) > 0 ? Number(route.query.vehiculo) : null)
const page = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1)

/** Vehículo del filtro, solo para mostrar su placa en el buscador. */
const filterVehicle = ref<VehicleOption | null>(null)

const formOpen = ref(false)
const editingReminder = ref<MaintenanceReminder | null>(null)

const reminderToDelete = ref<MaintenanceReminder | null>(null)
const deleting = ref(false)
/** Id del recordatorio que se está marcando como completado. */
const completingId = ref<number | null>(null)

// El día actual se fija al entrar: basta para resaltar los vencidos.
const today = todayInputValue()

/**
 * El backend no recalcula el estado con el paso del tiempo: un recordatorio
 * pendiente cuya fecha ya pasó sigue guardado como `PENDING`. Se resalta aquí
 * para que recepción lo detecte sin depender de que alguien lo marque a mano.
 */
function isOverdue(reminder: MaintenanceReminder): boolean {
  return reminder.status === 'PENDING' && toDateInputValue(reminder.scheduledDate) < today
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const result = await listReminders({
      page: page.value,
      limit: PAGE_SIZE,
      status: status.value || undefined,
      vehicleId: vehicleId.value ?? undefined,
    })
    reminders.value = result.reminders
    meta.value = result.meta
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar los recordatorios')
  } finally {
    loading.value = false
  }
}

/** Guarda el estado del listado en la URL y recarga los datos. */
function reload(): void {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (status.value) query.status = status.value
  if (vehicleId.value !== null) query.vehiculo = String(vehicleId.value)

  router.replace({ query })
  load()
}

function onFilterChange(): void {
  page.value = 1
  reload()
}

/**
 * El buscador ya recuerda el vehículo que el usuario acaba de elegir, así que
 * `filterVehicle` solo hace falta al restaurar el filtro desde la URL: aquí se
 * descarta para no dejar guardado uno que ya no corresponde.
 */
function onVehicleFilterChange(id: number | null): void {
  vehicleId.value = id
  filterVehicle.value = null
  onFilterChange()
}

function goToPage(next: number): void {
  page.value = next
  reload()
}

function openCreate(): void {
  editingReminder.value = null
  formOpen.value = true
}

function openEdit(reminder: MaintenanceReminder): void {
  editingReminder.value = reminder
  formOpen.value = true
}

function onSaved(): void {
  formOpen.value = false
  reload()
}

async function markCompleted(reminder: MaintenanceReminder): Promise<void> {
  completingId.value = reminder.id
  try {
    await completeReminder(reminder.id)
    toast.success('Recordatorio marcado como completado')
    reload()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo completar el recordatorio'))
  } finally {
    completingId.value = null
  }
}

async function confirmDelete(): Promise<void> {
  const reminder = reminderToDelete.value
  if (!reminder) return

  deleting.value = true
  try {
    await deleteReminder(reminder.id)
    toast.success('Recordatorio eliminado correctamente')
    reminderToDelete.value = null

    // Si era el último de la página, se retrocede para no quedar en una vacía.
    if (reminders.value.length === 1 && page.value > 1) page.value -= 1
    reload()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo eliminar el recordatorio'))
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  load()

  // Con el filtro restaurado desde la URL solo se tiene el id: se pide el
  // vehículo para que el buscador muestre la placa en vez de quedar vacío.
  if (vehicleId.value !== null) {
    try {
      filterVehicle.value = await getVehicle(vehicleId.value)
    } catch {
      // Sin la placa el filtro sigue aplicándose; solo se ve el buscador vacío.
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-wrap items-end gap-3">
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
            <option v-for="(label, value) in reminderStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="form-control w-full sm:w-72">
          <label class="label" for="vehicleFilter">
            <span class="label-text">Vehículo</span>
          </label>
          <VehicleSelect
            id="vehicleFilter"
            :model-value="vehicleId"
            :selected="filterVehicle"
            @update:model-value="onVehicleFilterChange"
          />
        </div>
      </div>

      <button type="button" class="btn btn-primary" @click="openCreate">Nuevo recordatorio</button>
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

        <div v-else-if="reminders.length === 0" class="px-4 py-12 text-center">
          <div class="text-4xl">🔔</div>
          <p class="mt-3 font-medium">
            {{
              status || vehicleId !== null
                ? 'Sin recordatorios con estos filtros'
                : 'Aún no hay recordatorios programados'
            }}
          </p>
          <p class="mt-1 text-sm opacity-70">
            {{
              status || vehicleId !== null
                ? 'Prueba con otro estado u otro vehículo.'
                : 'Programa el primero con el botón «Nuevo recordatorio».'
            }}
          </p>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Mantenimiento</th>
                  <th>Fecha programada</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reminder in reminders" :key="reminder.id" class="hover">
                  <td>
                    <span class="font-mono">{{ reminder.vehicle?.plate ?? '—' }}</span>
                    <span v-if="reminder.vehicle" class="ml-1 opacity-70">
                      {{ reminder.vehicle.brand }} {{ reminder.vehicle.model }}
                    </span>
                  </td>
                  <td>
                    <p class="font-medium">{{ reminder.description }}</p>
                    <p v-if="reminder.notes" class="max-w-xs truncate text-xs opacity-70">
                      {{ reminder.notes }}
                    </p>
                  </td>
                  <td :class="{ 'font-medium text-error': isOverdue(reminder) }">
                    {{ formatDateOnly(reminder.scheduledDate) }}
                    <span v-if="isOverdue(reminder)" class="block text-xs">Fecha vencida</span>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="reminderStatusBadges[reminder.status]">
                      {{ reminderStatusLabels[reminder.status] }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button
                        v-if="reminder.status !== 'COMPLETED'"
                        type="button"
                        class="btn btn-ghost btn-xs text-success"
                        :disabled="completingId === reminder.id"
                        @click="markCompleted(reminder)"
                      >
                        <span
                          v-if="completingId === reminder.id"
                          class="loading loading-spinner loading-xs"
                        ></span>
                        Completar
                      </button>
                      <button type="button" class="btn btn-ghost btn-xs" @click="openEdit(reminder)">
                        Editar
                      </button>
                      <button
                        v-if="canDelete"
                        type="button"
                        class="btn btn-ghost btn-xs text-error"
                        @click="reminderToDelete = reminder"
                      >
                        Eliminar
                      </button>
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

    <ReminderFormModal
      :open="formOpen"
      :reminder="editingReminder"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <ConfirmDialog
      :open="reminderToDelete !== null"
      title="Eliminar recordatorio"
      :message="`¿Seguro que deseas eliminar el recordatorio «${reminderToDelete?.description}»? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :loading="deleting"
      @close="reminderToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
