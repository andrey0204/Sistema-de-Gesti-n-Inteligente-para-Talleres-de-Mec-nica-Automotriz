<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import VehicleSelect from '@/components/VehicleSelect.vue'
import {
  createReminder,
  updateReminder,
  type CreateReminderPayload,
} from '@/api/maintenance-reminders'
import { getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { reminderStatusLabels } from '@/lib/labels'
import { toDateInputValue, todayInputValue } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import type { MaintenanceReminder, ReminderStatus } from '@/types/models'

const props = defineProps<{
  open: boolean
  /** `null` para crear; un recordatorio para editar. */
  reminder: MaintenanceReminder | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()

const isEditing = computed(() => props.reminder !== null)

const validationSchema = toTypedSchema(
  z.object({
    description: z.string().trim().min(1, 'Describe el mantenimiento a recordar'),
    // El input `date` entrega `YYYY-MM-DD`, que es justo lo que espera el backend.
    scheduledDate: z
      .string()
      .trim()
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Elige la fecha programada'),
    vehicleId: z
      .number()
      .int()
      .positive()
      .nullable()
      .refine((value) => value !== null, 'Selecciona el vehículo'),
    status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE']),
    notes: z.string().trim(),
  }),
)

type ReminderFormValues = {
  description: string
  scheduledDate: string
  vehicleId: number | null
  status: ReminderStatus
  notes: string
}

function toFormValues(reminder: MaintenanceReminder | null): ReminderFormValues {
  return {
    description: reminder?.description ?? '',
    // Al crear se propone hoy: la mayoría de recordatorios se programan a partir
    // de la fecha actual y así el campo nunca queda vacío por descuido.
    scheduledDate: reminder ? toDateInputValue(reminder.scheduledDate) : todayInputValue(),
    vehicleId: reminder?.vehicleId ?? null,
    status: reminder?.status ?? 'PENDING',
    notes: reminder?.notes ?? '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [description, descriptionAttrs] = defineField('description')
const [scheduledDate, scheduledDateAttrs] = defineField('scheduledDate')
const [vehicleId] = defineField('vehicleId')
const [status, statusAttrs] = defineField('status')
const [notes, notesAttrs] = defineField('notes')

// Al abrir se recarga el formulario: evita arrastrar el recordatorio anterior.
watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: toFormValues(props.reminder) })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  // El esquema ya obliga a elegir vehículo; el guardián solo estrecha el tipo.
  if (values.vehicleId === null) return

  try {
    if (props.reminder) {
      // El backend no permite reasignar el vehículo, por eso no va en el payload.
      // En edición sí acepta `null` para limpiar las notas.
      await updateReminder(props.reminder.id, {
        description: values.description,
        scheduledDate: values.scheduledDate,
        status: values.status,
        notes: values.notes || null,
      })
      toast.success('Recordatorio actualizado correctamente')
    } else {
      // En creación el backend no acepta cadena vacía: las notas se omiten.
      const payload: CreateReminderPayload = {
        description: values.description,
        scheduledDate: values.scheduledDate,
        vehicleId: values.vehicleId,
      }
      if (values.notes) payload.notes = values.notes

      await createReminder(payload)
      toast.success('Recordatorio creado correctamente')
    }

    emit('saved')
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo guardar el recordatorio'))
  }
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEditing ? 'Editar recordatorio' : 'Nuevo recordatorio'"
    size="lg"
    @close="emit('close')"
  >
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="form-control sm:col-span-2">
          <label class="label" for="vehicleId">
            <span class="label-text">Vehículo *</span>
          </label>

          <!-- Al editar el vehículo es fijo: el backend no admite reasignarlo. -->
          <div
            v-if="isEditing"
            class="rounded-lg border border-base-300 bg-base-200 px-3 py-2"
          >
            <p class="font-mono font-medium">{{ reminder?.vehicle?.plate ?? '—' }}</p>
            <p class="text-sm opacity-70">
              {{ reminder?.vehicle?.brand }} {{ reminder?.vehicle?.model }}
            </p>
          </div>

          <template v-else>
            <VehicleSelect id="vehicleId" v-model="vehicleId" :invalid="Boolean(errors.vehicleId)" />
            <p v-if="errors.vehicleId" class="mt-1 text-sm text-error">{{ errors.vehicleId }}</p>
          </template>
        </div>

        <div class="form-control sm:col-span-2">
          <label class="label" for="description">
            <span class="label-text">Descripción *</span>
          </label>
          <input
            id="description"
            v-model="description"
            v-bind="descriptionAttrs"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.description }"
            placeholder="Cambio de aceite, rotación de llantas…"
          />
          <p v-if="errors.description" class="mt-1 text-sm text-error">{{ errors.description }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="scheduledDate">
            <span class="label-text">Fecha programada *</span>
          </label>
          <input
            id="scheduledDate"
            v-model="scheduledDate"
            v-bind="scheduledDateAttrs"
            type="date"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.scheduledDate }"
          />
          <p v-if="errors.scheduledDate" class="mt-1 text-sm text-error">
            {{ errors.scheduledDate }}
          </p>
        </div>

        <!-- El estado solo se edita: uno nuevo siempre nace pendiente. -->
        <div v-if="isEditing" class="form-control">
          <label class="label" for="status">
            <span class="label-text">Estado</span>
          </label>
          <select
            id="status"
            v-model="status"
            v-bind="statusAttrs"
            class="select select-bordered w-full"
          >
            <option v-for="(label, value) in reminderStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="form-control sm:col-span-2">
          <label class="label" for="notes">
            <span class="label-text">Notas</span>
          </label>
          <textarea
            id="notes"
            v-model="notes"
            v-bind="notesAttrs"
            rows="3"
            class="textarea textarea-bordered w-full"
            placeholder="Detalles para el taller o para avisar al cliente…"
          ></textarea>
        </div>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" :disabled="isSubmitting" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          {{ isEditing ? 'Guardar cambios' : 'Crear recordatorio' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
