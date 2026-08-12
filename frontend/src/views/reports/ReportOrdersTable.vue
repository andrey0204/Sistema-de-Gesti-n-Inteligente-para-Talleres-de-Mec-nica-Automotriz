<script setup lang="ts">
import { computed, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import PaginationControls from '@/components/PaginationControls.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { downloadCsv, type CsvColumn } from '@/lib/csv'
import { formatCurrency, formatDate } from '@/lib/format'
import { workOrderStatusBadges, workOrderStatusLabels } from '@/lib/labels'
import type { ReportOrder } from '@/api/reports'

const props = defineProps<{
  orders: ReportOrder[]
  /** Sufijo del archivo exportado, con el rango consultado. */
  periodLabel: string
}>()

const { meta, pageItems, goToPage } = useClientPagination(toRef(props, 'orders'))

/** Suma de lo facturado: solo cuenta las órdenes que ya tienen costo final. */
const invoiced = computed(() =>
  props.orders.reduce((sum, order) => sum + Number(order.finalCost ?? 0), 0),
)

/**
 * Los importes se exportan con coma decimal: con punto, Excel en es-CO los lee
 * como texto y no se pueden sumar en la hoja.
 */
function toSpreadsheetNumber(value: string | null): string {
  return value === null ? '' : value.replace('.', ',')
}

const CSV_COLUMNS: CsvColumn<ReportOrder>[] = [
  { header: 'Orden', value: (order) => order.id },
  { header: 'Fecha', value: (order) => formatDate(order.createdAt) },
  { header: 'Cliente', value: (order) => order.client?.fullName ?? '' },
  { header: 'Placa', value: (order) => order.vehicle?.plate ?? '' },
  {
    header: 'Vehículo',
    value: (order) => (order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ''),
  },
  { header: 'Mecánico', value: (order) => order.assignedTo?.fullName ?? 'Sin asignar' },
  { header: 'Estado', value: (order) => workOrderStatusLabels[order.status] },
  { header: 'Costo estimado', value: (order) => toSpreadsheetNumber(order.estimatedCost) },
  { header: 'Costo final', value: (order) => toSpreadsheetNumber(order.finalCost) },
]

function exportCsv(): void {
  downloadCsv(`ordenes-${props.periodLabel}`, CSV_COLUMNS, props.orders)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm opacity-70">
        Facturado en el periodo:
        <span class="font-semibold opacity-100">{{ formatCurrency(invoiced) }}</span>
        <span class="opacity-60"> (solo órdenes con costo final registrado)</span>
      </p>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        :disabled="orders.length === 0"
        @click="exportCsv"
      >
        Exportar CSV
      </button>
    </div>

    <div v-if="orders.length === 0" class="py-12 text-center">
      <div class="text-4xl">🔧</div>
      <p class="mt-3 font-medium">No se crearon órdenes en este periodo</p>
      <p class="mt-1 text-sm opacity-70">Prueba con un rango de fechas más amplio.</p>
    </div>

    <template v-else>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Mecánico</th>
              <th>Estado</th>
              <th class="text-right">Costo final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pageItems" :key="order.id" class="hover">
              <td>
                <RouterLink
                  :to="{ name: 'work-orders-detail', params: { id: order.id } }"
                  class="link link-primary font-mono"
                >
                  #{{ order.id }}
                </RouterLink>
              </td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>{{ order.client?.fullName ?? '—' }}</td>
              <td>
                <span class="font-mono">{{ order.vehicle?.plate ?? '—' }}</span>
                <span v-if="order.vehicle" class="ml-1 opacity-70">
                  {{ order.vehicle.brand }} {{ order.vehicle.model }}
                </span>
              </td>
              <td>
                <span :class="{ 'opacity-60': !order.assignedTo }">
                  {{ order.assignedTo?.fullName ?? 'Sin asignar' }}
                </span>
              </td>
              <td>
                <span class="badge badge-sm" :class="workOrderStatusBadges[order.status]">
                  {{ workOrderStatusLabels[order.status] }}
                </span>
              </td>
              <td class="text-right tabular-nums">{{ formatCurrency(order.finalCost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls :meta="meta" @change="goToPage" />
    </template>
  </div>
</template>
