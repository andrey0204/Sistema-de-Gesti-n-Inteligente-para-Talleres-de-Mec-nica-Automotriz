<script setup lang="ts">
/** Servicios y repuestos de una orden, con el total calculado en el cliente. */
import { computed, onMounted, ref } from 'vue'
import WorkOrderItemFormModal from './WorkOrderItemFormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { deleteItem, listItems } from '@/api/work-order-items'
import { getErrorMessage } from '@/lib/http'
import { formatCurrency } from '@/lib/format'
import { workOrderItemTypeLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import type { WorkOrderItem } from '@/types/models'

const props = defineProps<{
  workOrderId: number
  /** Solo ADMIN y MECHANIC pueden tocar los items (lo impone el backend). */
  canEdit: boolean
}>()

const toast = useToast()

const items = ref<WorkOrderItem[]>([])
const loading = ref(false)
const loadError = ref('')

const formOpen = ref(false)
const editingItem = ref<WorkOrderItem | null>(null)

const itemToDelete = ref<WorkOrderItem | null>(null)
const deleting = ref(false)

/** Los `Decimal` de Prisma llegan como string, hay que convertirlos para sumar. */
function subtotal(item: WorkOrderItem): number {
  return item.quantity * Number(item.unitPrice)
}

const total = computed(() => items.value.reduce((sum, item) => sum + subtotal(item), 0))

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    items.value = await listItems(props.workOrderId)
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar los items')
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  editingItem.value = null
  formOpen.value = true
}

function openEdit(item: WorkOrderItem): void {
  editingItem.value = item
  formOpen.value = true
}

function onSaved(): void {
  formOpen.value = false
  load()
}

async function confirmDelete(): Promise<void> {
  const item = itemToDelete.value
  if (!item) return

  deleting.value = true
  try {
    await deleteItem(props.workOrderId, item.id)
    toast.success('Item eliminado correctamente')
    itemToDelete.value = null
    load()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo eliminar el item'))
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body gap-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="card-title text-base">Servicios y repuestos</h2>
        <button v-if="canEdit" type="button" class="btn btn-sm btn-primary" @click="openCreate">
          Agregar item
        </button>
      </div>

      <div v-if="loadError" role="alert" class="alert alert-error">
        <span>{{ loadError }}</span>
        <button type="button" class="btn btn-sm" @click="load">Reintentar</button>
      </div>

      <div v-if="loading" class="flex justify-center py-6">
        <span class="loading loading-spinner"></span>
      </div>

      <p v-else-if="items.length === 0" class="py-4 text-sm opacity-70">
        Todavía no hay servicios ni repuestos registrados en esta orden.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">Precio unitario</th>
              <th class="text-right">Subtotal</th>
              <th v-if="canEdit" class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="hover">
              <td>
                <span class="badge badge-ghost badge-sm">
                  {{ workOrderItemTypeLabels[item.type] }}
                </span>
              </td>
              <td>{{ item.description }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ formatCurrency(item.unitPrice) }}</td>
              <td class="text-right font-medium">{{ formatCurrency(subtotal(item)) }}</td>
              <td v-if="canEdit">
                <div class="flex justify-end gap-1">
                  <button type="button" class="btn btn-ghost btn-xs" @click="openEdit(item)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-error"
                    @click="itemToDelete = item"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th :colspan="4" class="text-right">Total</th>
              <th class="text-right text-base">{{ formatCurrency(total) }}</th>
              <th v-if="canEdit"></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <WorkOrderItemFormModal
      :open="formOpen"
      :work-order-id="workOrderId"
      :item="editingItem"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <ConfirmDialog
      :open="itemToDelete !== null"
      title="Eliminar item"
      :message="`¿Seguro que deseas eliminar «${itemToDelete?.description}» de la orden?`"
      confirm-label="Eliminar"
      :loading="deleting"
      @close="itemToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
