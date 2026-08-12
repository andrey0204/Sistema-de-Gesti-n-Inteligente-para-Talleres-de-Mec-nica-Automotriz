<script setup lang="ts">
import { toRef } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { downloadCsv, type CsvColumn } from '@/lib/csv'
import type { ReportClient } from '@/api/reports'

const props = defineProps<{
  clients: ReportClient[]
  periodLabel: string
}>()

const { meta, pageItems, goToPage } = useClientPagination(toRef(props, 'clients'))

const CSV_COLUMNS: CsvColumn<ReportClient>[] = [
  { header: 'Cliente', value: (client) => client.fullName },
  { header: 'Documento', value: (client) => client.documentNumber },
  { header: 'Teléfono', value: (client) => client.phone },
]

function exportCsv(): void {
  downloadCsv(`clientes-atendidos-${props.periodLabel}`, CSV_COLUMNS, props.clients)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm opacity-70">
        Clientes distintos con al menos una orden creada en el periodo.
      </p>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        :disabled="clients.length === 0"
        @click="exportCsv"
      >
        Exportar CSV
      </button>
    </div>

    <div v-if="clients.length === 0" class="py-12 text-center">
      <div class="text-4xl">👥</div>
      <p class="mt-3 font-medium">Ningún cliente fue atendido en este periodo</p>
      <p class="mt-1 text-sm opacity-70">Prueba con un rango de fechas más amplio.</p>
    </div>

    <template v-else>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in pageItems" :key="client.id" class="hover">
              <td class="font-medium">{{ client.fullName }}</td>
              <td class="font-mono">{{ client.documentNumber }}</td>
              <td>{{ client.phone }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls :meta="meta" @change="goToPage" />
    </template>
  </div>
</template>
