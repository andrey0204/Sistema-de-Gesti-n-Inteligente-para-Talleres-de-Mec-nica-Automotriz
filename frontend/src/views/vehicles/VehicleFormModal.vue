<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import ClientSelect from '@/components/ClientSelect.vue'
import { createVehicle, updateVehicle, type CreateVehiclePayload } from '@/api/vehicles'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { fuelTypeLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import type { FuelType, Vehicle } from '@/types/models'

const props = defineProps<{
  open: boolean
  /** `null` para crear; un vehículo para editar. */
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()

const isEditing = computed(() => props.vehicle !== null)

// Mismo límite que el backend: no se registran modelos más de un año por delante.
const MAX_YEAR = new Date().getFullYear() + 1

const validationSchema = toTypedSchema(
  z.object({
    plate: z.string().trim().min(1, 'La placa es obligatoria'),
    brand: z.string().trim().min(1, 'La marca es obligatoria'),
    model: z.string().trim().min(1, 'El modelo es obligatorio'),
    clientId: z
      .number()
      .int()
      .positive()
      .nullable()
      .refine((value) => value !== null, 'Selecciona el cliente propietario'),
    // Los numéricos se manejan como texto (así los entrega el input) y se
    // convierten al enviar; la cadena vacía significa «sin dato».
    year: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d{4}$/.test(value), 'Escribe un año de 4 dígitos')
      .refine(
        (value) => value === '' || (Number(value) >= 1900 && Number(value) <= MAX_YEAR),
        `El año debe estar entre 1900 y ${MAX_YEAR}`,
      ),
    currentMileage: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), 'El kilometraje admite solo números'),
    color: z.string().trim(),
    vin: z.string().trim(),
    fuelType: z.union([z.literal(''), z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS'])]),
    notes: z.string().trim(),
  }),
)

type VehicleFormValues = {
  plate: string
  brand: string
  model: string
  clientId: number | null
  year: string
  currentMileage: string
  color: string
  vin: string
  fuelType: FuelType | ''
  notes: string
}

function toFormValues(vehicle: Vehicle | null): VehicleFormValues {
  return {
    plate: vehicle?.plate ?? '',
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    clientId: vehicle?.clientId ?? null,
    year: vehicle?.year != null ? String(vehicle.year) : '',
    currentMileage: vehicle?.currentMileage != null ? String(vehicle.currentMileage) : '',
    color: vehicle?.color ?? '',
    vin: vehicle?.vin ?? '',
    fuelType: vehicle?.fuelType ?? '',
    notes: vehicle?.notes ?? '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [plate, plateAttrs] = defineField('plate')
const [brand, brandAttrs] = defineField('brand')
const [model, modelAttrs] = defineField('model')
const [clientId] = defineField('clientId')
const [year, yearAttrs] = defineField('year')
const [currentMileage, currentMileageAttrs] = defineField('currentMileage')
const [color, colorAttrs] = defineField('color')
const [vin, vinAttrs] = defineField('vin')
const [fuelType, fuelTypeAttrs] = defineField('fuelType')
const [notes, notesAttrs] = defineField('notes')

// Al abrir se recarga el formulario: evita arrastrar datos del vehículo anterior.
watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: toFormValues(props.vehicle) })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  // El esquema ya obliga a elegir cliente; el guardián solo estrecha el tipo.
  if (values.clientId === null) return

  // Placa y VIN se guardan en mayúsculas para que la búsqueda sea consistente.
  const plateValue = values.plate.toUpperCase()
  const vinValue = values.vin.toUpperCase()

  try {
    if (props.vehicle) {
      // En edición se envía `null` para limpiar los campos opcionales vacíos.
      await updateVehicle(props.vehicle.id, {
        plate: plateValue,
        brand: values.brand,
        model: values.model,
        clientId: values.clientId,
        year: values.year ? Number(values.year) : null,
        currentMileage: values.currentMileage ? Number(values.currentMileage) : null,
        color: values.color || null,
        vin: vinValue || null,
        fuelType: values.fuelType || null,
        notes: values.notes || null,
      })
      toast.success('Vehículo actualizado correctamente')
    } else {
      // En creación el backend no acepta cadena vacía: los opcionales se omiten.
      const payload: CreateVehiclePayload = {
        plate: plateValue,
        brand: values.brand,
        model: values.model,
        clientId: values.clientId,
      }
      if (values.year) payload.year = Number(values.year)
      if (values.currentMileage) payload.currentMileage = Number(values.currentMileage)
      if (values.color) payload.color = values.color
      if (vinValue) payload.vin = vinValue
      if (values.fuelType) payload.fuelType = values.fuelType
      if (values.notes) payload.notes = values.notes

      await createVehicle(payload)
      toast.success('Vehículo creado correctamente')
    }

    emit('saved')
  } catch (error) {
    // El backend usa el mismo código para placa y VIN duplicados; se distinguen
    // por el mensaje para señalar el campo correcto en el formulario.
    if (getErrorCode(error) === 'CONFLICT') {
      if (getErrorMessage(error).includes('VIN')) {
        setErrors({ vin: 'Ya existe un vehículo con este VIN' })
      } else {
        setErrors({ plate: 'Ya existe un vehículo con esta placa' })
      }
      return
    }

    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo guardar el vehículo'))
  }
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEditing ? 'Editar vehículo' : 'Nuevo vehículo'"
    size="lg"
    @close="emit('close')"
  >
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="form-control sm:col-span-2">
          <label class="label" for="clientId">
            <span class="label-text">Cliente propietario *</span>
          </label>
          <ClientSelect
            id="clientId"
            v-model="clientId"
            :selected="vehicle?.client ?? null"
            :invalid="Boolean(errors.clientId)"
          />
          <p v-if="errors.clientId" class="mt-1 text-sm text-error">{{ errors.clientId }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="plate">
            <span class="label-text">Placa *</span>
          </label>
          <input
            id="plate"
            v-model="plate"
            v-bind="plateAttrs"
            type="text"
            class="input input-bordered w-full uppercase"
            :class="{ 'input-error': errors.plate }"
            placeholder="ABC-123"
          />
          <p v-if="errors.plate" class="mt-1 text-sm text-error">{{ errors.plate }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="year">
            <span class="label-text">Año</span>
          </label>
          <input
            id="year"
            v-model="year"
            v-bind="yearAttrs"
            type="text"
            inputmode="numeric"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.year }"
          />
          <p v-if="errors.year" class="mt-1 text-sm text-error">{{ errors.year }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="brand">
            <span class="label-text">Marca *</span>
          </label>
          <input
            id="brand"
            v-model="brand"
            v-bind="brandAttrs"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.brand }"
          />
          <p v-if="errors.brand" class="mt-1 text-sm text-error">{{ errors.brand }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="model">
            <span class="label-text">Modelo *</span>
          </label>
          <input
            id="model"
            v-model="model"
            v-bind="modelAttrs"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.model }"
          />
          <p v-if="errors.model" class="mt-1 text-sm text-error">{{ errors.model }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="fuelType">
            <span class="label-text">Tipo de combustible</span>
          </label>
          <select
            id="fuelType"
            v-model="fuelType"
            v-bind="fuelTypeAttrs"
            class="select select-bordered w-full"
          >
            <option value="">Sin especificar</option>
            <option v-for="(label, value) in fuelTypeLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="form-control">
          <label class="label" for="color">
            <span class="label-text">Color</span>
          </label>
          <input
            id="color"
            v-model="color"
            v-bind="colorAttrs"
            type="text"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control">
          <label class="label" for="currentMileage">
            <span class="label-text">Kilometraje</span>
          </label>
          <input
            id="currentMileage"
            v-model="currentMileage"
            v-bind="currentMileageAttrs"
            type="text"
            inputmode="numeric"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.currentMileage }"
          />
          <p v-if="errors.currentMileage" class="mt-1 text-sm text-error">
            {{ errors.currentMileage }}
          </p>
        </div>

        <div class="form-control">
          <label class="label" for="vin">
            <span class="label-text">VIN</span>
          </label>
          <input
            id="vin"
            v-model="vin"
            v-bind="vinAttrs"
            type="text"
            class="input input-bordered w-full uppercase"
            :class="{ 'input-error': errors.vin }"
          />
          <p v-if="errors.vin" class="mt-1 text-sm text-error">{{ errors.vin }}</p>
        </div>

        <div class="form-control sm:col-span-2">
          <label class="label" for="notes">
            <span class="label-text">Observaciones</span>
          </label>
          <textarea
            id="notes"
            v-model="notes"
            v-bind="notesAttrs"
            rows="3"
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
          {{ isEditing ? 'Guardar cambios' : 'Crear vehículo' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
