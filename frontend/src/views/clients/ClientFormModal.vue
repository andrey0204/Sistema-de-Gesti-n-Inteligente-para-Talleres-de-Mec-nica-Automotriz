<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import { createClient, updateClient, type CreateClientPayload } from '@/api/clients'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { documentTypeLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import type { Client, DocumentType } from '@/types/models'

const props = defineProps<{
  open: boolean
  /** `null` para crear; un cliente para editar. */
  client: Client | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()

const isEditing = computed(() => props.client !== null)

const validationSchema = toTypedSchema(
  z.object({
    fullName: z.string().trim().min(1, 'El nombre es obligatorio'),
    phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
    documentType: z.enum(['CC', 'CE', 'NIT', 'PASSPORT'], {
      error: 'Selecciona un tipo de documento',
    }),
    documentNumber: z.string().trim().min(1, 'El número de documento es obligatorio'),
    // Opcionales: se admite cadena vacía y, si trae algo, debe ser un correo válido.
    email: z.union([z.literal(''), z.email('Correo electrónico inválido')]),
    address: z.string().trim(),
    notes: z.string().trim(),
  }),
)

type ClientFormValues = {
  fullName: string
  phone: string
  documentType: DocumentType
  documentNumber: string
  email: string
  address: string
  notes: string
}

function toFormValues(client: Client | null): ClientFormValues {
  return {
    fullName: client?.fullName ?? '',
    phone: client?.phone ?? '',
    documentType: client?.documentType ?? 'CC',
    documentNumber: client?.documentNumber ?? '',
    email: client?.email ?? '',
    address: client?.address ?? '',
    notes: client?.notes ?? '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [phone, phoneAttrs] = defineField('phone')
const [documentType, documentTypeAttrs] = defineField('documentType')
const [documentNumber, documentNumberAttrs] = defineField('documentNumber')
const [email, emailAttrs] = defineField('email')
const [address, addressAttrs] = defineField('address')
const [notes, notesAttrs] = defineField('notes')

// Al abrir se recarga el formulario: evita arrastrar datos del cliente anterior.
watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: toFormValues(props.client) })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.client) {
      // En edición se envía `null` para limpiar los campos opcionales vacíos.
      await updateClient(props.client.id, {
        fullName: values.fullName,
        phone: values.phone,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      })
      toast.success('Cliente actualizado correctamente')
    } else {
      // En creación el backend no acepta cadena vacía: los opcionales se omiten.
      const payload: CreateClientPayload = {
        fullName: values.fullName,
        phone: values.phone,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
      }
      if (values.email) payload.email = values.email
      if (values.address) payload.address = values.address
      if (values.notes) payload.notes = values.notes

      await createClient(payload)
      toast.success('Cliente creado correctamente')
    }

    emit('saved')
  } catch (error) {
    if (getErrorCode(error) === 'CONFLICT') {
      setErrors({ documentNumber: 'Ya existe un cliente con este número de documento' })
      return
    }

    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo guardar el cliente'))
  }
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEditing ? 'Editar cliente' : 'Nuevo cliente'"
    size="lg"
    @close="emit('close')"
  >
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="form-control sm:col-span-2">
          <label class="label" for="fullName">
            <span class="label-text">Nombre completo *</span>
          </label>
          <input
            id="fullName"
            v-model="fullName"
            v-bind="fullNameAttrs"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.fullName }"
          />
          <p v-if="errors.fullName" class="mt-1 text-sm text-error">{{ errors.fullName }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="documentType">
            <span class="label-text">Tipo de documento *</span>
          </label>
          <select
            id="documentType"
            v-model="documentType"
            v-bind="documentTypeAttrs"
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.documentType }"
          >
            <option v-for="(label, value) in documentTypeLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
          <p v-if="errors.documentType" class="mt-1 text-sm text-error">{{ errors.documentType }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="documentNumber">
            <span class="label-text">Número de documento *</span>
          </label>
          <input
            id="documentNumber"
            v-model="documentNumber"
            v-bind="documentNumberAttrs"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.documentNumber }"
          />
          <p v-if="errors.documentNumber" class="mt-1 text-sm text-error">
            {{ errors.documentNumber }}
          </p>
        </div>

        <div class="form-control">
          <label class="label" for="phone">
            <span class="label-text">Teléfono *</span>
          </label>
          <input
            id="phone"
            v-model="phone"
            v-bind="phoneAttrs"
            type="tel"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.phone }"
          />
          <p v-if="errors.phone" class="mt-1 text-sm text-error">{{ errors.phone }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="email">
            <span class="label-text">Correo electrónico</span>
          </label>
          <input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.email }"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-error">{{ errors.email }}</p>
        </div>

        <div class="form-control sm:col-span-2">
          <label class="label" for="address">
            <span class="label-text">Dirección</span>
          </label>
          <input
            id="address"
            v-model="address"
            v-bind="addressAttrs"
            type="text"
            class="input input-bordered w-full"
          />
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
          {{ isEditing ? 'Guardar cambios' : 'Crear cliente' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
