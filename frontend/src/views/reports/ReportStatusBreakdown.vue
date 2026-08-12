<script setup lang="ts">
import { computed } from 'vue'
import { workOrderStatusBadges, workOrderStatusLabels, workOrderStatusProgress } from '@/lib/labels'
import { formatNumber } from '@/lib/format'
import type { OrdersByStatusReport } from '@/api/reports'
import type { WorkOrderStatus } from '@/types/models'

const props = defineProps<{
  report: OrdersByStatusReport | null
  loading: boolean
}>()

/**
 * El backend solo devuelve los estados que tienen órdenes. Se completan los
 * demás en cero para que la distribución se lea siempre igual, sin filas que
 * aparecen y desaparecen según los datos.
 */
const rows = computed(() => {
  const counts = new Map<WorkOrderStatus, number>(
    props.report?.byStatus.map((entry) => [entry.status, entry.count]) ?? [],
  )
  const total = props.report?.total ?? 0

  return (Object.keys(workOrderStatusLabels) as WorkOrderStatus[]).map((status) => {
    const count = counts.get(status) ?? 0
    return {
      status,
      count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 100),
    }
  })
})
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <div>
        <h2 class="card-title text-base">Órdenes por estado</h2>
        <!-- Este endpoint no acepta rango: se dice explícitamente para que no
             se confunda con las tarjetas del periodo que tiene al lado. -->
        <p class="text-sm opacity-70">Histórico completo, no depende del periodo seleccionado.</p>
      </div>

      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!report || report.total === 0" class="py-8 text-center text-sm opacity-70">
        Todavía no hay órdenes registradas.
      </div>

      <ul v-else class="flex flex-col gap-3">
        <li v-for="row in rows" :key="row.status" class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="badge badge-sm" :class="workOrderStatusBadges[row.status]">
              {{ workOrderStatusLabels[row.status] }}
            </span>
            <span class="tabular-nums">
              {{ formatNumber(row.count) }}
              <span class="opacity-60">({{ row.percentage }} %)</span>
            </span>
          </div>
          <progress
            class="progress w-full"
            :class="workOrderStatusProgress[row.status]"
            :value="row.count"
            :max="report.total"
          ></progress>
        </li>
      </ul>
    </div>
  </div>
</template>
