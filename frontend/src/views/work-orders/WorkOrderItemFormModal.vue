<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import { createItem, updateItem, type ItemPayload } from '@/api/work-order-items'
import { getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { workOrderItemTypeLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import type { WorkOrderItem, WorkOrderItemType } from '@/types/models'

const props = defineProps<{
  open: boolean
  workOrderId: number
  /** `null` para agregar; un item para editarlo. */
  item: WorkOrderItem | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()

const isEditing = computed(() => props.item !== null)

/** Precio sin separador de miles y con punto o coma para los decimales. */
const PRICE_PATTERN = /^\d+([.,]\d{1,2})?$/

const validationSchema = toTypedSchema(
  z.object({
    type: z.enum(['SERVICE', 'PART'], { error: 'Selecciona el tipo' }),
    description: z.string().trim().min(1, 'La descripción es obligatoria'),
    quantity: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value), 'La cantidad admite solo números')
      .refine((value) => Number(value) >= 1, 'La cantidad debe ser al menos 1'),
    unitPrice: z
      .string()
      .trim()
      .refine(
        (value) => PRICE_PATTERN.test(value),
        'Escribe el precio sin separador de miles (ej. 150000 o 150000.50)',
      ),
  }),
)

type ItemFormValues = {
  type: WorkOrderItemType
  description: string
  quantity: string
  unitPrice: string
}

function toFormValues(item: WorkOrderItem | null): ItemFormValues {
  return {
    type: item?.type ?? 'SERVICE',
    description: item?.description ?? '',
    quantity: item ? String(item.quantity) : '1',
    // El backend devuelve los Decimal como string (ej. "150000.00").
    unitPrice: item?.unitPrice ?? '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [type, typeAttrs] = defineField('type')
const [description, descriptionAttrs] = defineField('description')
const [quantity, quantityAttrs] = defineField('quantity')
const [unitPrice, unitPriceAttrs] = defineField('unitPrice')

watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: toFormValues(props.item) })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  const payload: ItemPayload = {
    type: values.type,
    description: values.description,
    quantity: Number(values.quantity),
    unitPrice: Number(values.unitPrice.replace(',', '.')),
  }

  try {
    if (props.item) {
      await updateItem(props.workOrderId, props.item.id, payload)
      toast.success('Item actualizado correctamente')
    } else {
      await createItem(props.workOrderId, payload)
      toast.success('Item agregado correctamente')
    }

    emit('saved')
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo guardar el item'))
  }
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEditing ? 'Editar item' : 'Agregar item'"
    @close="emit('close')"
  >
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="form-control">
        <label class="label" for="itemType">
          <span class="label-text">Tipo *</span>
        </label>
        <select
          id="itemType"
          v-model="type"
          v-bind="typeAttrs"
          class="select select-bordered w-full"
        >
          <option v-for="(label, value) in workOrderItemTypeLabels" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>

      <div class="form-control">
        <label class="label" for="itemDescription">
          <span class="label-text">Descripción *</span>
        </label>
        <input
          id="itemDescription"
          v-model="description"
          v-bind="descriptionAttrs"
          type="text"
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.description }"
          placeholder="Cambio de aceite, pastillas de freno…"
        />
        <p v-if="errors.description" class="mt-1 text-sm text-error">{{ errors.description }}</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="form-control">
          <label class="label" for="itemQuantity">
            <span class="label-text">Cantidad *</span>
          </label>
          <input
            id="itemQuantity"
            v-model="quantity"
            v-bind="quantityAttrs"
            type="text"
            inputmode="numeric"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.quantity }"
          />
          <p v-if="errors.quantity" class="mt-1 text-sm text-error">{{ errors.quantity }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="itemUnitPrice">
            <span class="label-text">Precio unitario *</span>
          </label>
          <input
            id="itemUnitPrice"
            v-model="unitPrice"
            v-bind="unitPriceAttrs"
            type="text"
            inputmode="decimal"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.unitPrice }"
            placeholder="150000"
          />
          <p v-if="errors.unitPrice" class="mt-1 text-sm text-error">{{ errors.unitPrice }}</p>
        </div>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" :disabled="isSubmitting" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          {{ isEditing ? 'Guardar cambios' : 'Agregar item' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
