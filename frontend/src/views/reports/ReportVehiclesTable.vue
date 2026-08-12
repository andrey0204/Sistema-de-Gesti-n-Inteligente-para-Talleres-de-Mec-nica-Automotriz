<script setup lang="ts">
import { toRef } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { downloadCsv, type CsvColumn } from '@/lib/csv'
import type { ReportVehicle } from '@/api/reports'

const props = defineProps<{
  vehicles: ReportVehicle[]
  periodLabel: string
}>()

const { meta, pageItems, goToPage } = useClientPagination(toRef(props, 'vehicles'))

const CSV_COLUMNS: CsvColumn<ReportVehicle>[] = [
  { header: 'Placa', value: (vehicle) => vehicle.plate },
  { header: 'Marca', value: (vehicle) => vehicle.brand },
  { header: 'Modelo', value: (vehicle) => vehicle.model },
  { header: 'Cliente', value: (vehicle) => vehicle.client?.fullName ?? '' },
]

function exportCsv(): void {
  downloadCsv(`vehiculos-atendidos-${props.periodLabel}`, CSV_COLUMNS, props.vehicles)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm opacity-70">
        Vehículos distintos con al menos una orden creada en el periodo.
      </p>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        :disabled="vehicles.length === 0"
        @click="exportCsv"
      >
        Exportar CSV
      </button>
    </div>

    <div v-if="vehicles.length === 0" class="py-12 text-center">
      <div class="text-4xl">🚗</div>
      <p class="mt-3 font-medium">Ningún vehículo entró al taller en este periodo</p>
      <p class="mt-1 text-sm opacity-70">Prueba con un rango de fechas más amplio.</p>
    </div>

    <template v-else>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Propietario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vehicle in pageItems" :key="vehicle.id" class="hover">
              <td class="font-mono">{{ vehicle.plate }}</td>
              <td>{{ vehicle.brand }}</td>
              <td>{{ vehicle.model }}</td>
              <td>{{ vehicle.client?.fullName ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls :meta="meta" @change="goToPage" />
    </template>
  </div>
</template>
