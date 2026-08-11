<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import AssignMechanicModal from './AssignMechanicModal.vue'
import WorkOrderImages from './WorkOrderImages.vue'
import WorkOrderItems from './WorkOrderItems.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { getWorkOrder, updateWorkOrder, updateWorkOrderStatus } from '@/api/work-orders'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { workOrderStatusBadges, workOrderStatusLabels } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import { getAllowedTransitions, isBackwardTransition, isFinalStatus } from '@/lib/work-order-transitions'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { WorkOrder, WorkOrderStatus } from '@/types/models'

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const workOrderId = Number(route.params.id)

const workOrder = ref<WorkOrder | null>(null)
const loading = ref(false)
const loadError = ref('')

const assignOpen = ref(false)
const statusToConfirm = ref<WorkOrderStatus | null>(null)
const changingStatus = ref(false)

/** Recepción y administración asignan mecánico; el mecánico no se autoasigna. */
const canAssign = auth.hasRole('ADMIN', 'RECEPTIONIST')
/** El backend solo deja tocar items a estos dos roles. */
const canEditItems = auth.hasRole('ADMIN', 'MECHANIC')

const allowedTransitions = computed(() =>
  workOrder.value ? getAllowedTransitions(workOrder.value.status, auth.role) : [],
)

/** Precio sin separador de miles y con punto o coma para los decimales. */
const PRICE_PATTERN = /^\d+([.,]\d{1,2})?$/
const PRICE_MESSAGE = 'Escribe el importe sin separador de miles (ej. 150000 o 150000.50)'

const validationSchema = toTypedSchema(
  z.object({
    diagnosis: z.string().trim(),
    observations: z.string().trim(),
    mileageAtReception: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), 'El kilometraje admite solo números'),
    estimatedCost: z
      .string()
      .trim()
      .refine((value) => value === '' || PRICE_PATTERN.test(value), PRICE_MESSAGE),
    finalCost: z
      .string()
      .trim()
      .refine((value) => value === '' || PRICE_PATTERN.test(value), PRICE_MESSAGE),
  }),
)

function toFormValues(order: WorkOrder | null) {
  return {
    diagnosis: order?.diagnosis ?? '',
    observations: order?.observations ?? '',
    mileageAtReception: order?.mileageAtReception != null ? String(order.mileageAtReception) : '',
    // Los Decimal llegan como string (ej. "150000.00").
    estimatedCost: order?.estimatedCost ?? '',
    finalCost: order?.finalCost ?? '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [diagnosis, diagnosisAttrs] = defineField('diagnosis')
const [observations, observationsAttrs] = defineField('observations')
const [mileageAtReception, mileageAtReceptionAttrs] = defineField('mileageAtReception')
const [estimatedCost, estimatedCostAttrs] = defineField('estimatedCost')
const [finalCost, finalCostAttrs] = defineField('finalCost')

// El formulario se rellena en cuanto llegan los datos de la orden.
watch(workOrder, (order) => resetForm({ values: toFormValues(order) }))

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    workOrder.value = await getWorkOrder(workOrderId)
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'FORBIDDEN') {
      loadError.value = 'Solo puedes consultar las órdenes que tienes asignadas.'
    } else if (code === 'NOT_FOUND') {
      loadError.value = `La orden #${workOrderId} no existe.`
    } else {
      loadError.value = getErrorMessage(error, 'No se pudo cargar la orden')
    }
  } finally {
    loading.value = false
  }
}

const onSubmit = handleSubmit(async (values) => {
  try {
    // Se envía `null` para limpiar los campos que se dejan vacíos.
    workOrder.value = await updateWorkOrder(workOrderId, {
      diagnosis: values.diagnosis || null,
      observations: values.observations || null,
      mileageAtReception: values.mileageAtReception ? Number(values.mileageAtReception) : null,
      estimatedCost: values.estimatedCost ? Number(values.estimatedCost.replace(',', '.')) : null,
      finalCost: values.finalCost ? Number(values.finalCost.replace(',', '.')) : null,
    })
    toast.success('Orden actualizada correctamente')
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo actualizar la orden'))
  }
})

/** Cancelar no tiene vuelta atrás, así que se confirma antes. */
function requestStatusChange(status: WorkOrderStatus): void {
  if (status === 'CANCELLED') {
    statusToConfirm.value = status
    return
  }
  changeStatus(status)
}

async function changeStatus(status: WorkOrderStatus): Promise<void> {
  changingStatus.value = true
  try {
    workOrder.value = await updateWorkOrderStatus(workOrderId, status)
    statusToConfirm.value = null
    toast.success(`Orden marcada como «${workOrderStatusLabels[status]}»`)
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo cambiar el estado de la orden'))
  } finally {
    changingStatus.value = false
  }
}

function onAssigned(updated: WorkOrder): void {
  assignOpen.value = false
  // La respuesta de asignar no trae los items, así que solo se refresca la cabecera.
  workOrder.value = { ...updated, items: workOrder.value?.items }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <RouterLink :to="{ name: 'work-orders' }" class="btn btn-ghost btn-sm w-fit">
      ← Volver a las órdenes
    </RouterLink>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm" @click="load">Reintentar</button>
    </div>

    <template v-else-if="workOrder">
      <!-- Cabecera: estado actual y transiciones permitidas -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold">Orden #{{ workOrder.id }}</h2>
              <span class="badge" :class="workOrderStatusBadges[workOrder.status]">
                {{ workOrderStatusLabels[workOrder.status] }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="status in allowedTransitions"
                :key="status"
                type="button"
                class="btn btn-sm"
                :class="
                  status === 'CANCELLED'
                    ? 'btn-error btn-outline'
                    : isBackwardTransition(workOrder.status, status)
                      ? 'btn-ghost'
                      : 'btn-primary'
                "
                :disabled="changingStatus"
                @click="requestStatusChange(status)"
              >
                {{
                  isBackwardTransition(workOrder.status, status)
                    ? `↩ Volver a ${workOrderStatusLabels[status].toLowerCase()}`
                    : workOrderStatusLabels[status]
                }}
              </button>

              <p v-if="isFinalStatus(workOrder.status)" class="text-sm opacity-70">
                Esta orden ya está en un estado final.
              </p>
            </div>
          </div>

          <div class="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="opacity-60">Cliente</p>
              <p class="font-medium">{{ workOrder.client?.fullName ?? '—' }}</p>
              <p class="opacity-70">{{ workOrder.client?.phone }}</p>
            </div>

            <div>
              <p class="opacity-60">Vehículo</p>
              <p class="font-mono font-medium">{{ workOrder.vehicle?.plate ?? '—' }}</p>
              <p class="opacity-70">
                {{ workOrder.vehicle?.brand }} {{ workOrder.vehicle?.model }}
              </p>
            </div>

            <div>
              <p class="opacity-60">Mecánico asignado</p>
              <p class="font-medium">{{ workOrder.assignedTo?.fullName ?? 'Sin asignar' }}</p>
              <button
                v-if="canAssign"
                type="button"
                class="btn btn-ghost btn-xs px-0"
                @click="assignOpen = true"
              >
                {{ workOrder.assignedTo ? 'Cambiar' : 'Asignar' }}
              </button>
            </div>

            <div>
              <p class="opacity-60">Creada</p>
              <p class="font-medium">{{ formatDateTime(workOrder.createdAt) }}</p>
              <p class="opacity-70">por {{ workOrder.createdBy?.fullName ?? '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Datos editables de la orden -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="card-title text-base">Diagnóstico y costos</h2>

          <form class="flex flex-col gap-3" novalidate @submit="onSubmit">
            <div class="form-control">
              <label class="label" for="diagnosis">
                <span class="label-text">Diagnóstico</span>
              </label>
              <textarea
                id="diagnosis"
                v-model="diagnosis"
                v-bind="diagnosisAttrs"
                rows="3"
                class="textarea textarea-bordered w-full"
              ></textarea>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="form-control">
                <label class="label" for="mileageAtReception">
                  <span class="label-text">Kilometraje de recepción</span>
                </label>
                <input
                  id="mileageAtReception"
                  v-model="mileageAtReception"
                  v-bind="mileageAtReceptionAttrs"
                  type="text"
                  inputmode="numeric"
                  class="input input-bordered w-full"
                  :class="{ 'input-error': errors.mileageAtReception }"
                />
                <p v-if="errors.mileageAtReception" class="mt-1 text-sm text-error">
                  {{ errors.mileageAtReception }}
                </p>
              </div>

              <div class="form-control">
                <label class="label" for="estimatedCost">
                  <span class="label-text">Costo estimado</span>
                </label>
                <input
                  id="estimatedCost"
                  v-model="estimatedCost"
                  v-bind="estimatedCostAttrs"
                  type="text"
                  inputmode="decimal"
                  class="input input-bordered w-full"
                  :class="{ 'input-error': errors.estimatedCost }"
                />
                <p v-if="errors.estimatedCost" class="mt-1 text-sm text-error">
                  {{ errors.estimatedCost }}
                </p>
              </div>

              <div class="form-control">
                <label class="label" for="finalCost">
                  <span class="label-text">Costo final</span>
                </label>
                <input
                  id="finalCost"
                  v-model="finalCost"
                  v-bind="finalCostAttrs"
                  type="text"
                  inputmode="decimal"
                  class="input input-bordered w-full"
                  :class="{ 'input-error': errors.finalCost }"
                />
                <p v-if="errors.finalCost" class="mt-1 text-sm text-error">
                  {{ errors.finalCost }}
                </p>
              </div>
            </div>

            <div class="form-control">
              <label class="label" for="observations">
                <span class="label-text">Observaciones</span>
              </label>
              <textarea
                id="observations"
                v-model="observations"
                v-bind="observationsAttrs"
                rows="2"
                class="textarea textarea-bordered w-full"
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>

      <WorkOrderItems :work-order-id="workOrderId" :can-edit="canEditItems" />

      <WorkOrderImages :work-order-id="workOrderId" :can-delete="auth.isAdmin" />

      <AssignMechanicModal
        :open="assignOpen"
        :work-order-id="workOrderId"
        :current-mechanic-id="workOrder.assignedToUserId"
        @close="assignOpen = false"
        @assigned="onAssigned"
      />

      <ConfirmDialog
        :open="statusToConfirm !== null"
        title="Cancelar orden"
        message="¿Seguro que deseas cancelar esta orden? Es un estado final y no se puede revertir."
        confirm-label="Cancelar orden"
        :loading="changingStatus"
        @close="statusToConfirm = null"
        @confirm="statusToConfirm && changeStatus(statusToConfirm)"
      />
    </template>
  </div>
</template>
