<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import ClientSelect from '@/components/ClientSelect.vue'
import { createWorkOrder, type CreateWorkOrderPayload } from '@/api/work-orders'
import { listVehicles } from '@/api/vehicles'
import { listMechanics } from '@/api/users'
import { getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { useToast } from '@/composables/useToast'
import type { User, Vehicle, WorkOrder } from '@/types/models'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: []; created: [workOrder: WorkOrder] }>()

const toast = useToast()

const validationSchema = toTypedSchema(
  z.object({
    clientId: z
      .number()
      .int()
      .positive()
      .nullable()
      .refine((value) => value !== null, 'Selecciona el cliente'),
    vehicleId: z
      .number()
      .int()
      .positive()
      .nullable()
      .refine((value) => value !== null, 'Selecciona el vehículo'),
    // El mecánico es opcional: se puede asignar más tarde desde el detalle.
    assignedToUserId: z.string(),
    mileageAtReception: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), 'El kilometraje admite solo números'),
    diagnosis: z.string().trim(),
    observations: z.string().trim(),
  }),
)

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: {
    clientId: null,
    vehicleId: null,
    assignedToUserId: '',
    mileageAtReception: '',
    diagnosis: '',
    observations: '',
  },
})

const [clientId] = defineField('clientId')
const [vehicleId] = defineField('vehicleId')
const [assignedToUserId, assignedToUserIdAttrs] = defineField('assignedToUserId')
const [mileageAtReception, mileageAtReceptionAttrs] = defineField('mileageAtReception')
const [diagnosis, diagnosisAttrs] = defineField('diagnosis')
const [observations, observationsAttrs] = defineField('observations')

const vehicles = ref<Vehicle[]>([])
const loadingVehicles = ref(false)
const vehiclesError = ref('')

const mechanics = ref<User[]>([])

/** Al cambiar de cliente se recargan sus vehículos y se descarta el elegido antes. */
watch(clientId, async (id) => {
  // Se descarta solo si ya había uno elegido: asignarlo cuando ya es `null`
  // dispara la validación y mostraría el error antes de tocar el campo.
  if (vehicleId.value !== null) vehicleId.value = null
  vehicles.value = []
  vehiclesError.value = ''
  if (id === null) return

  loadingVehicles.value = true
  try {
    const result = await listVehicles({ clientId: id, limit: 100 })
    vehicles.value = result.vehicles

    // Con un solo vehículo no tiene sentido obligar a elegirlo.
    if (result.vehicles.length === 1) vehicleId.value = result.vehicles[0].id
  } catch (error) {
    vehiclesError.value = getErrorMessage(error, 'No se pudieron cargar los vehículos del cliente')
  } finally {
    loadingVehicles.value = false
  }
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    resetForm()
    vehicles.value = []
    vehiclesError.value = ''

    if (mechanics.value.length === 0) {
      try {
        mechanics.value = await listMechanics()
      } catch {
        // Sin la lista, la orden se crea sin asignar y se asigna desde el detalle.
      }
    }
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  // El esquema ya obliga a elegirlos; el guardián solo estrecha el tipo.
  if (values.clientId === null || values.vehicleId === null) return

  try {
    // El backend no acepta cadena vacía: los opcionales se omiten del payload.
    const payload: CreateWorkOrderPayload = {
      clientId: values.clientId,
      vehicleId: values.vehicleId,
    }
    if (values.assignedToUserId) payload.assignedToUserId = Number(values.assignedToUserId)
    if (values.mileageAtReception) payload.mileageAtReception = Number(values.mileageAtReception)
    if (values.diagnosis) payload.diagnosis = values.diagnosis
    if (values.observations) payload.observations = values.observations

    const workOrder = await createWorkOrder(payload)
    toast.success(`Orden #${workOrder.id} creada correctamente`)
    emit('created', workOrder)
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo crear la orden'))
  }
})
</script>

<template>
  <BaseModal :open="open" title="Nueva orden de trabajo" size="lg" @close="emit('close')">
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="form-control sm:col-span-2">
          <label class="label" for="clientId">
            <span class="label-text">Cliente *</span>
          </label>
          <ClientSelect id="clientId" v-model="clientId" :invalid="Boolean(errors.clientId)" />
          <p v-if="errors.clientId" class="mt-1 text-sm text-error">{{ errors.clientId }}</p>
        </div>

        <div class="form-control sm:col-span-2">
          <label class="label" for="vehicleId">
            <span class="label-text">Vehículo *</span>
          </label>

          <div v-if="loadingVehicles" class="flex items-center gap-2 text-sm opacity-70">
            <span class="loading loading-spinner loading-xs"></span>
            Cargando vehículos…
          </div>

          <p v-else-if="vehiclesError" class="text-sm text-error">{{ vehiclesError }}</p>

          <p v-else-if="clientId === null" class="text-sm opacity-70">
            Elige primero el cliente para ver sus vehículos.
          </p>

          <p v-else-if="vehicles.length === 0" class="text-sm text-warning">
            Este cliente no tiene vehículos registrados. Regístralo en la sección Vehículos antes
            de abrir la orden.
          </p>

          <select
            v-else
            id="vehicleId"
            v-model="vehicleId"
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.vehicleId }"
          >
            <option :value="null">Selecciona un vehículo</option>
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.plate }} — {{ vehicle.brand }} {{ vehicle.model }}
              <template v-if="vehicle.year">({{ vehicle.year }})</template>
            </option>
          </select>

          <p v-if="errors.vehicleId" class="mt-1 text-sm text-error">{{ errors.vehicleId }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="assignedToUserId">
            <span class="label-text">Mecánico asignado</span>
          </label>
          <select
            id="assignedToUserId"
            v-model="assignedToUserId"
            v-bind="assignedToUserIdAttrs"
            class="select select-bordered w-full"
            :disabled="mechanics.length === 0"
          >
            <option value="">Sin asignar</option>
            <option v-for="mechanic in mechanics" :key="mechanic.id" :value="String(mechanic.id)">
              {{ mechanic.fullName }}
            </option>
          </select>
        </div>

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

        <div class="form-control sm:col-span-2">
          <label class="label" for="diagnosis">
            <span class="label-text">Diagnóstico inicial</span>
          </label>
          <textarea
            id="diagnosis"
            v-model="diagnosis"
            v-bind="diagnosisAttrs"
            rows="3"
            class="textarea textarea-bordered w-full"
            placeholder="Falla reportada por el cliente, hallazgos iniciales…"
          ></textarea>
        </div>

        <div class="form-control sm:col-span-2">
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
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" :disabled="isSubmitting" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          Crear orden
        </button>
      </div>
    </form>
  </BaseModal>
</template>
